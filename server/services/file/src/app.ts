import express, { type Express } from "express";
import cookieParser from "cookie-parser";

import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import routes from "./routes/index.js";

const createApp = (): Express => {
    const app = express();

    //Request parsing
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

    //API Routes
    app.use("/", routes);

    app.get("/health", (_req, res) => {
        res.status(200).json({
            success: true,
            service: "file",
            status: "healthy",
            timestamp: new Date().toISOString(),
        });
    });

    //Error Handling
    app.use(notFoundMiddleware);
    app.use(errorMiddleware);

    return app;
};

export default createApp();