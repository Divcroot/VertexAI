import type { NextFunction, Request, Response } from "express";

import redis from "../../../shared/redis/index.js";

import { AppError } from "../error/AppError.js";

export const protect = async (
    req: Request,
    _res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const sessionId = req.cookies?.session;

        if (!sessionId) {
            throw new AppError("Unauthorized", 401);
        }

        const session = await redis.get(`session:${sessionId}`);

        if (!session) {
            throw new AppError("Session expired or invalid", 401);
        }

        req.user = JSON.parse(session);

        next();
    } catch (error) {
        next(error);
    }
};