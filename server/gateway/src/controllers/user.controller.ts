import type { Request, Response } from "express";

export const getCurrentUser = (
    req: Request,
    res: Response,
): void => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
};