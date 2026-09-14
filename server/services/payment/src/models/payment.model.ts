import {
    Schema,
    model,
    type Document,
    type Types,
} from "mongoose";

export interface IPayment extends Document {
    userId: Types.ObjectId;
    plan: "pro" | "team";
    amount: number;
    credits: number;
    currency: string;
    razorpayOrderId: string;
    razorpayPaymentId: string | null;
    status: "created" | "paid" | "failed";
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        userId: {
            type: Schema.Types.ObjectId,
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
        },

        credits: {
            type: Number,
            required: true,
        },

        currency: {
            type: String,
            default: "INR",
        },

        razorpayOrderId: {
            type: String,
            required: true,
            unique: true,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: ["created", "paid", "failed"],
            default: "created",
        },
    },
    {
        timestamps: true,
    },
);

const Payment = model<IPayment>("Payment", paymentSchema);

export default Payment;