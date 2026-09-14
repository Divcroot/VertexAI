import { env } from "./env.js";

interface DeductCreditsResponse {
    success?: boolean;
    message?: string;
    credits?: number;
    data?: unknown;
    [key: string]: unknown;
}

export const deductCredits = async (
    userId: string,
    amount: number,
): Promise<DeductCreditsResponse> => {
    if (!userId) {
        throw new Error("userId is required");
    }

    if (!amount || amount <= 0) {
        throw new Error("Credit amount must be greater than 0");
    }

    const response = await fetch(
        `${env.AUTH_SERVICE_URL}/credits/deduct`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                amount,
                userId,
            }),
        },
    );

    const text = await response.text();

    let data: DeductCreditsResponse = {};

    try {
        data = text
            ? (JSON.parse(text) as DeductCreditsResponse)
            : {};
    } catch {
        data = {
            message: text,
        };
    }

    if (!response.ok) {
        const error = new Error(
            data.message || "Unable to deduct credits",
        );

        Object.assign(error, {
            status: response.status,
            credits: data.credits,
        });

        throw error;
    }

    return data;
};