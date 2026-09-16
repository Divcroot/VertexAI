import axios from "axios";

import { env } from "../config/env.js";
import { AppError } from "../error/AppError.js";

type UserPlan = "free" | "pro" | "team";

interface DeductCreditsResponse {
    success: boolean;
    message: string;
    data: {
        credits: number;
        plan: UserPlan;
    };
}

interface CreditResult {
    credits: number;
    plan: UserPlan;
}

export const deductCredits = async (
    userId: string,
    amount: number,
    sessionCookie: string,
): Promise<CreditResult> => {
    if (!userId) {
        throw new AppError("User ID is required", 401);
    }

    if (!amount || amount <= 0) {
        throw new AppError(
            "Credit amount must be greater than zero",
            400,
        );
    }

    if (!sessionCookie) {
        throw new AppError("Session is required", 401);
    }

    try {
        const response =
            await axios.post<DeductCreditsResponse>(
                `${env.AUTH_SERVICE_URL}/deduct-credits`,
                { amount },
                {
                    headers: {
                        "Content-Type":
                            "application/json",
                        "x-user-id": userId,
                        Cookie: sessionCookie,
                    },
                    timeout: 10_000,
                },
            );

        if (
            !response.data ||
            !response.data.data
        ) {
            throw new AppError(
                "Invalid credit response from auth service",
                500,
            );
        }

        return response.data.data;
    } catch (error: unknown) {
        if (error instanceof AppError) {
            throw error;
        }

        if (axios.isAxiosError<DeductCreditsResponse>(error)) {
            const message =
                error.response?.data?.message ??
                "Unable to deduct credits";

            const statusCode =
                error.response?.status ?? 500;

            throw new AppError(
                message,
                statusCode,
            );
        }

        throw new AppError(
            "Unable to deduct credits",
            500,
        );
    }
};