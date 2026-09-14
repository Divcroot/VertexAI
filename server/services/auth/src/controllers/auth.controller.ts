import type {
    NextFunction,
    Request,
    Response,
} from "express";

import { env } from "../config/env.js";
import { AppError } from "../error/AppError.js";
import {
    addCredits as addCreditsService,
    deductCredits as deductCreditsService,
    login as loginService,
    logout as logoutService,
} from "../services/auth.service.js";

const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const getUserId = (req: Request): string => {
    const userId = req.headers["x-user-id"];

    if (
        !userId ||
        typeof userId !== "string"
    ) {
        throw new AppError(
            "User ID is required",
            401,
        );
    }

    return userId;
};

const getSessionId = (req: Request): string => {
    const sessionId = req.cookies?.[SESSION_COOKIE];

    if (
        !sessionId ||
        typeof sessionId !== "string"
    ) {
        throw new AppError(
            "Session is required",
            401,
        );
    }

    return sessionId;
};

const clearSessionCookie = (
    res: Response,
): void => {
    res.clearCookie(
        SESSION_COOKIE,
        {
            path: "/",
            secure:
                env.NODE_ENV === "production",
            sameSite: "lax",
        },
    );
};

// =====================================================
// LOGIN
// =====================================================

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { token } = req.body;

        if (
            typeof token !== "string" ||
            !token.trim()
        ) {
            throw new AppError(
                "Firebase token is required",
                400,
            );
        }

        const {
            user,
            sessionId,
        } = await loginService(
            token.trim(),
        );

        res.cookie(
            SESSION_COOKIE,
            sessionId,
            {
                httpOnly: true,
                secure:
                    env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: SESSION_MAX_AGE,
            },
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// LOGOUT
// =====================================================

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const sessionId =
            req.cookies?.[SESSION_COOKIE];

        if (
            !sessionId ||
            typeof sessionId !== "string"
        ) {
            clearSessionCookie(res);

            res.status(200).json({
                success: true,
                message: "Already logged out",
            });

            return;
        }

        await logoutService(sessionId);

        clearSessionCookie(res);

        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// DEDUCT CREDITS
// =====================================================

export const deductCredits = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);
        const sessionId = getSessionId(req);

        const amount = Number(
            req.body?.amount,
        );

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            throw new AppError(
                "Invalid credit amount",
                400,
            );
        }

        const result =
            await deductCreditsService(
                userId,
                sessionId,
                amount,
            );

        res.status(200).json({
            success: true,
            data: {
                credits: result.credits,
                deducted: amount,
            }
        });
    } catch (error) {
        next(error);
    }
};

// =====================================================
// ADD CREDITS
// =====================================================

export const addCredits = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);
        const sessionId = getSessionId(req);

        const {
            plan,
            credits,
        } = req.body ?? {};

        if (
            plan !== "pro" &&
            plan !== "team"
        ) {
            throw new AppError(
                "Invalid plan",
                400,
            );
        }

        const amount = Number(credits);

        if (
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            throw new AppError(
                "Invalid credit amount",
                400,
            );
        }

        const result =
            await addCreditsService(
                userId,
                sessionId,
                plan,
                amount,
            );

        res.status(200).json({
            success: true,
            credits: result.credits,
            plan: result.plan,
        });
    } catch (error) {
        next(error);
    }
};