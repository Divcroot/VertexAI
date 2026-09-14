import type {
    NextFunction,
    Request,
    Response,
} from "express";

import redis from "../../../shared/redis/index.js";

import { AppError } from "../error/AppError.js";

interface SessionData {
    userId: string;
    name: string;
    email: string;
    avatar: string;
    credits: number;
    plan: "free" | "pro" | "team";
}

export const protect = async (
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const sessionId =
            req.cookies?.session;

        if (
            typeof sessionId !== "string" ||
            !sessionId.trim()
        ) {
            throw new AppError(
                "Unauthorized",
                401,
            );
        }

        const sessionData =
            await redis.get(
                `session:${sessionId}`,
            );

        if (!sessionData) {
            throw new AppError(
                "Session expired or invalid",
                401,
            );
        }

        let session: SessionData;

        try {
            session =
                JSON.parse(
                    sessionData,
                ) as SessionData;
        } catch {
            throw new AppError(
                "Invalid session data",
                401,
            );
        }

        if (
            !session.userId ||
            !session.email ||
            !session.name
        ) {
            throw new AppError(
                "Invalid session data",
                401,
            );
        }

        req.user = {
            userId: session.userId,
            name: session.name,
            email: session.email,
            avatar: session.avatar,
            credits: session.credits,
            plan: session.plan,
        };

        next();
    } catch (error: unknown) {
        next(error);
    }
};