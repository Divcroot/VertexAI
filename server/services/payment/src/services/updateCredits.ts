import axios from "axios";

import { env } from "../config/env.js";
import { AppError } from "../error/AppError.js";
import type {
    AuthCreditResponse,
    Plan,
} from "../types/payment.types.js";

export const addCreditsToUser = async (
    userId: string,
    credits: number,
    cookieHeader: string,
    plan: Plan,
): Promise<AuthCreditResponse> => {
    if (!userId) {
        throw new AppError(
            "User ID is required",
            401,
        );
    }

    if (!credits || credits <= 0) {
        throw new AppError(
            "Credits must be greater than zero",
            400,
        );
    }

    if (!cookieHeader) {
        throw new AppError(
            "Session is required",
            401,
        );
    }

    try {
        const response =
            await axios.post<AuthCreditResponse>(
                `${env.AUTH_SERVICE_URL}/add-credits`,
                {
                    plan,
                    credits,
                },
                {
                    headers: {
                        "Content-Type":
                            "application/json",
                        "x-user-id": userId,
                        Cookie: cookieHeader,
                    },
                    timeout: 10_000,
                },
            );

        return response.data;
    } catch (error: unknown) {
        if (
            axios.isAxiosError<AuthCreditResponse>(
                error,
            )
        ) {
            const message =
                error.response?.data?.message ??
                "Unable to add credits";

            const statusCode =
                error.response?.status ?? 500;

            throw new AppError(
                message,
                statusCode,
            );
        }

        throw new AppError(
            "Unable to add credits",
            500,
        );
    }
};