import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import routes from "./routes/index.js";

const createApp = (): Express => {
    const app = express();

    // Security
    app.disable("x-powered-by");
    app.use(helmet());

    // Request logging
    app.use(
        morgan(
            env.NODE_ENV === "production"
                ? "combined"
                : "dev",
        ),
    );

    // CORS
    app.use(
        cors({
            origin: env.CORS_ORIGIN,
            credentials: true,
        }),
    );

    // Request parsing
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

    // Cookie parsing
    app.use(cookieParser());

    // Health check
    app.get("/", (_req, res) => {
        res.status(200).json({
            success: true,
            service: "gateway",
            status: "healthy",
            timestamp: new Date().toISOString(),
        });
    });

    // API routes
    app.use("/api", routes);

    // Error handling
    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
};

export default createApp();