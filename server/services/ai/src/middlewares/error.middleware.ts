import type {
    ErrorRequestHandler,
    Request,
    Response,
} from "express";
import { AppError } from "../error/AppError.js";

export const errorMiddleware: ErrorRequestHandler = (
    error: unknown,
    _req: Request,
    res: Response,
): void => {
    console.error("Gateway error:", error);

    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });

        return;
    }

    if (error instanceof Error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });

        return;
    }

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
};