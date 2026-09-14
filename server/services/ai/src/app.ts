import express, { type Express } from "express";

import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import routes from "./routes/index.js";

const createApp = (): Express => {
    const app = express();

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

    // Service health check
    app.get("/health", (_req, res) => {
        res.status(200).json({
            success: true,
            service: "ai",
            status: "healthy",
            timestamp: new Date().toISOString(),
        });
    });

    // API routes
    app.use("/", routes);

    // Error handling
    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
};

export default createApp();