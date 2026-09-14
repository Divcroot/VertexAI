import type { NextFunction, Request, Response } from "express";

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
import { AppError } from "../error/AppError.js";

const getUserId = (value: string | string[] | undefined): string | null => {
	return typeof value === "string" && value.length > 0 ? value : null;
};

const isPlan = (value: unknown): value is Plan => {
	return value === "pro" || value === "team";
};

const isPaymentDetails = (
	body: VerifyPaymentBody,
): body is PaymentDetails => {
	return (
		typeof body.razorpay_order_id === "string" &&
		typeof body.razorpay_payment_id === "string" &&
		typeof body.razorpay_signature === "string" &&
		body.razorpay_order_id.length > 0 &&
		body.razorpay_payment_id.length > 0 &&
		body.razorpay_signature.length > 0
	);
};

export const createOrder = async (
	req: Request<{}, unknown, CreateOrderBody>,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const userId = getUserId(req.headers["x-user-id"]);

		if (!userId) {
			throw new AppError("User ID is required", 400);
			return;
		}

		if (!isPlan(req.body.plan)) {
			throw new AppError("Invalid plan", 400);
			return;
		}

		const result = await createOrderService(userId, req.body.plan);

		res.status(201).json({
			success: true,
			...result,
		});
	} catch (error) {
		next(error);
	}
};

export const verifyPayment = async (
	req: Request<{}, unknown, VerifyPaymentBody>,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		const userId = getUserId(req.headers["x-user-id"]);

		if (!userId) {
			throw new AppError("User ID is required", 400);
			return;
		}

		if (!isPaymentDetails(req.body)) {
			throw new AppError("Payment details are required", 400);
			return;
		}

		const result = await verifyPaymentService(
			userId,
			req.body,
			typeof req.headers.cookie === "string"
				? req.headers.cookie
				: undefined,
		);

		res.json({
			success: true,
			...result,
		});
	} catch (error) {
		next(error);
	}
};
