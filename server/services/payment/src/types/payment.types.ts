export type Plan = "pro" | "team";

export interface PlanDetails {
    name: string;
    amount: number;
    credits: number;
}

export type PlanCatalog = Record<
    Plan,
    PlanDetails
>;

export interface CreateOrderBody {
    plan?: unknown;
}

export interface VerifyPaymentBody {
    razorpay_order_id?: unknown;
    razorpay_payment_id?: unknown;
    razorpay_signature?: unknown;
}

export interface PaymentDetails {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface CreateOrderResult {
    order: {
        id: string;
        amount: number;
        currency: string;
    };

    plan: {
        name: string;
        credits: number;
    };

    keyId: string;
}

export interface VerifyPaymentResult {
    message: string;
    plan: Plan;
    credits: number;
}

export interface AuthCreditResponse {
    success: boolean;
    message: string;
    data: {
        credits: number;
        plan: "free" | "pro" | "team";
    };
}