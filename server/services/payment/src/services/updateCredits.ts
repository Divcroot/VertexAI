import { env } from "../config/env.js";
import type { AuthCreditResponse } from "../types/payment.types.js";

export const addCreditsToUser = async (
    userId: string,
    credits: number,
    cookieHeader?: string,
): Promise<AuthCreditResponse> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": userId,
    };

    if (cookieHeader) {
        headers.cookie = cookieHeader;
    }

    const response = await fetch(`${env.AUTH_SERVICE_URL}/add-credits`, {
        method: "POST",
        headers,
        body: JSON.stringify({ credits }),
    });

    const text = await response.text();
    let data: AuthCreditResponse = {};

    try {
        data = text ? (JSON.parse(text) as AuthCreditResponse) : {};
    } catch {
        data = { message: text };
    }

    if (!response.ok) {
        throw new Error(data.message ?? "Unable to add credits");
    }

    return data;
};
