import {
    Schema,
    model,
    type Document,
    type Types,
} from "mongoose";

import type { Plan as PaymentPlan } from "../types/payment.types.js";

export type PaymentStatus =
    | "created"
    | "paid"
    | "failed";

export interface IPayment extends Document {
    userId: Types.ObjectId;
    plan: PaymentPlan;
    amount: number;
    credits: number;
    currency: "INR";
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    status: PaymentStatus;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        plan: {
            type: String,
            enum: ["pro", "team"],
            required: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        credits: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
            enum: ["INR"],
            default: "INR",
        },

        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
            index: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "created",
                "paid",
                "failed",
            ],
            default: "created",
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

paymentSchema.index({
    userId: 1,
    status: 1,
});

const Payment = model<IPayment>(
    "Payment",
    paymentSchema,
);

export default Payment;