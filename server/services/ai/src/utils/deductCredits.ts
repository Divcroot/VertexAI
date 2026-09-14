import axios from "axios";

import { env } from "../config/env.js";
import { AppError } from "../error/AppError.js";

interface DeductCreditsResponse {
	success?: boolean;
	credits?: number;
	deducted?: number;
	message?: string;
}

export const deductCredits = async (
	userId: string,
	amount: number,
): Promise<DeductCreditsResponse> => {
	try {
		const response = await axios.post<DeductCreditsResponse>(
			`${env.AUTH_SERVICE_URL}/credits/deduct`,
			{
				amount,
				userId,
			},
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		return response.data;
	} catch (error: unknown) {
		if (axios.isAxiosError<DeductCreditsResponse>(error)) {
			const message =
				error.response?.data?.message ??
				"Unable to deduct credits";
			const statusCode = error.response?.status ?? 500;

			throw new AppError(message, statusCode);
		}

		throw new AppError("Unable to deduct credits", 500);
	}
};
