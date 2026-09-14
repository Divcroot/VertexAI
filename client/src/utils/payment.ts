import axios from "axios";

import api from "./api";

export interface PaymentPlan {
	key: "free" | "pro" | "team";
}

export interface PaymentData {
	razorpay_order_id: string;
	razorpay_payment_id: string;
	razorpay_signature: string;
}

export interface PaymentResponse {
	success: boolean;
	message?: string;
	[key: string]: unknown;
}

export const createPaymentOrder = async (
	plan: PaymentPlan,
): Promise<PaymentResponse> => {
	try {
		const { data } = await api.post<PaymentResponse>(
			"/api/payment/orders",
			{
				plan: plan.key,
			},
		);

		return data;
	} catch (error: unknown) {
		console.error("CREATE PAYMENT ORDER ERROR:", error);

		return {
			success: false,
			message: axios.isAxiosError<{ message?: string }>(error)
				? error.response?.data?.message ??
					"Unable to create payment order"
				: "Unable to create payment order",
		};
	}
};

export const verifyPayment = async (
	paymentData: PaymentData,
): Promise<PaymentResponse> => {
	try {
		const { data } = await api.post<PaymentResponse>(
			"/api/payment/verify",
			paymentData,
		);

		return data;
	} catch (error: unknown) {
		console.error("VERIFY PAYMENT ERROR:", error);

		return {
			success: false,
			message: axios.isAxiosError<{ message?: string }>(error)
				? error.response?.data?.message ??
					"Payment verification failed"
				: "Payment verification failed",
		};
	}
};
