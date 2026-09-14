import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { AppError } from "../error/AppError.js";
import {
    login as loginService,
    logout as logoutService,
    deductCredits as deductCreditsService,
    addCredits as addCreditsService,
} from "../services/auth.service.js";

export const login = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { token } = req.body;

        if (!token) {
            throw new AppError("Firebase token is required", 400);
        }

        const { user, sessionId } = await loginService(token);

        res.cookie("session", sessionId, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const sessionId = req.cookies?.session;

        if (!sessionId) {
            res.clearCookie("session", { path: "/" });
            res.status(200).json({
                success: true,
                message: "Already logged out",
            });
            return;
        }

        await logoutService(sessionId);

        res.clearCookie("session", { path: "/" });

        res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        next(error);
    }
};

export const deductCredits = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const sessionId = req.cookies?.session;

        if (!sessionId || typeof sessionId !== "string") {
            throw new AppError("Session is required", 401);
        }

        const amount = Number(req.body.amount);

        if (!Number.isInteger(amount) || amount <= 0) {
            throw new AppError("Invalid credit amount", 400);
        }

        const result = await deductCreditsService(
            userId,
            sessionId,
            amount,
        );

        res.status(200).json({
            success: true,
            credits: result.credits,
            deducted: amount,
        });
    } catch (error) {
        next(error);
    }
};

export const addCredits = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const sessionId = req.cookies?.session;

        if (!sessionId || typeof sessionId !== "string") {
            throw new AppError("Session is required", 401);
        }

        const { credits } = req.body;

        const amount = Number(credits);

        if (!Number.isInteger(amount) || amount <= 0) {
            throw new AppError("Invalid credit amount", 400);
        }

        const result = await addCreditsService(
            userId,
            sessionId,
            amount,
        );

        res.status(200).json({
            success: true,
            credits: result.credits,
        });
    } catch (error) {
        next(error);
    }
};