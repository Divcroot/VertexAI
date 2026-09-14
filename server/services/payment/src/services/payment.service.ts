import crypto from "node:crypto";

import razorpay from "../config/razorpay.js";
import { env } from "../config/env.js";
import { AppError } from "../error/AppError.js";
import Payment from "../models/payment.model.js";
import { addCreditsToUser } from "./updateCredits.js";
import type {
    CreateOrderResult,
    PaymentDetails,
    Plan,
    PlanCatalog,
    VerifyPaymentResult,
} from "../types/payment.types.js";

const PLANS: PlanCatalog = {
    pro: {
        name: "Pro",
        amount: 29900,
        credits: 500,
    },
    team: {
        name: "Team",
        amount: 79900,
        credits: 2000,
    },
};

export const createOrder = async (
    userId: string,
    plan: Plan,
): Promise<CreateOrderResult> => {
    const selectedPlan = PLANS[plan];
    const order = await razorpay.orders.create({
        amount: selectedPlan.amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
            userId,
            plan,
        },
    });

    await Payment.create({
        userId,
        plan,
        amount: selectedPlan.amount,
        credits: selectedPlan.credits,
        currency: "INR",
        razorpayOrderId: order.id,
        status: "created",
    });

    return {
        order: {
            id: order.id,
            amount: Number(order.amount),
            currency: order.currency,
        },
        plan: {
            name: selectedPlan.name,
            credits: selectedPlan.credits,
        },
        keyId: env.RAZORPAY_KEY_ID,
    };
};

export const verifyPayment = async (
    userId: string,
    paymentDetails: PaymentDetails,
    cookieHeader?: string,
): Promise<VerifyPaymentResult> => {
    const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
    } = paymentDetails;
    const payment = await Payment.findOne({
        razorpayOrderId: orderId,
        userId,
    } as Record<string, string>);

    if (!payment) {
        throw new AppError("Payment order not found", 404);
    }

    if (payment.status === "paid") {
        return {
            message: "Payment already verified",
            credits: payment.credits,
        };
    }

    const generatedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    const signaturesMatch =
        generatedSignature.length === signature.length &&
        crypto.timingSafeEqual(
            Buffer.from(generatedSignature),
            Buffer.from(signature),
        );

    if (!signaturesMatch) {
        payment.status = "failed";
        await payment.save();
        throw new AppError("Invalid payment signature", 400);
    }

    payment.status = "paid";
    payment.razorpayPaymentId = paymentId;
    await payment.save();

    await addCreditsToUser(userId, payment.credits, cookieHeader);

    return {
        message: "Payment verified successfully",
        plan: payment.plan,
        credits: payment.credits,
    };
};
