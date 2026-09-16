import type { NextFunction, Request, Response } from "express";

import { AppError } from "../error/AppError.js";
import {
    createOrder as createOrderService,
    verifyPayment as verifyPaymentService,
} from "../services/payment.service.js";
import type {
    CreateOrderBody,
    PaymentDetails,
    Plan,
    VerifyPaymentBody,
} from "../types/payment.types.js";

const getUserId = (
    value: string | string[] | undefined,
): string => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new AppError(
            "User ID is required",
            401,
        );
    }

    return value;
};

const isPlan = (
    value: unknown,
): value is Plan => {
    return (
        value === "pro" ||
        value === "team"
    );
};

const isPaymentDetails = (
    body: VerifyPaymentBody,
): body is PaymentDetails => {
    return (
        typeof body.razorpay_order_id === "string" &&
        body.razorpay_order_id.trim().length > 0 &&
        typeof body.razorpay_payment_id === "string" &&
        body.razorpay_payment_id.trim().length > 0 &&
        typeof body.razorpay_signature === "string" &&
        body.razorpay_signature.trim().length > 0
    );
};

export const createOrder = async (
    req: Request<{}, unknown, CreateOrderBody>,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(
            req.headers["x-user-id"],
        );

        if (!isPlan(req.body?.plan)) {
            throw new AppError(
                "Invalid plan",
                400,
            );
        }

        const result = await createOrderService(
            userId,
            req.body.plan,
        );

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        next(error);
    }
};

export const verifyPayment = async (
    req: Request<{}, unknown, VerifyPaymentBody>,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(
            req.headers["x-user-id"],
        );

        if (!isPaymentDetails(req.body)) {
            throw new AppError(
                "Payment details are required",
                400,
            );
        }

        const sessionCookie = req.headers.cookie;

        if (
            !sessionCookie ||
            typeof sessionCookie !== "string"
        ) {
            throw new AppError(
                "Session is required",
                401,
            );
        }

        const result =
            await verifyPaymentService(
                userId,
                req.body,
                sessionCookie,
            );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: unknown) {
        next(error);
    }
};