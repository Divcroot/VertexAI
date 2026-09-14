import express, {
    type Express,
    type Request,
    type Response,
} from "express";

import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";

const createApp = (): Express => {
    const app = express();

    // =================================================
    // REQUEST PARSING
    // =================================================

    app.use(
        express.json({
            limit: "1mb",
        }),
    );

    app.use(
        express.urlencoded({
            extended: true,
            limit: "1mb",
        }),
    );

    // =================================================
    // HEALTH CHECK
    // =================================================

    app.get(
        "/health",
        (
            _req: Request,
            res: Response,
        ): void => {
            res.status(200).json({
                success: true,
                service: "terminal",
                status: "healthy",
                timestamp: new Date().toISOString(),
            });
        },
    );

    // =================================================
    // ERROR HANDLING
    // =================================================

    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
};

export default createApp();