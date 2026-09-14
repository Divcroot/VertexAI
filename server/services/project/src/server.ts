import dns from "node:dns";
import http from "node:http";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const server = http.createServer(app);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server.listen(env.PORT, env.HOST, () => {
      console.log(
        `🚀 Project service running on http://${env.HOST}:${env.PORT}`,
      );
    });
  } catch (error) {
    console.error(
      "❌ Failed to start project service:",
      error,
    );
    process.exit(1);
  }
};

let isShuttingDown = false;

const shutdown = (signal: string): void => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `\n${signal} received. Shutting down gracefully...`,
  );

  server.close((error) => {
    if (error) {
      console.error(
        "❌ Error while shutting down server:",
        error,
      );
      process.exit(1);
    }

    console.log(
      "✅ Project service shut down successfully.",
    );
    process.exit(0);
  });
};

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error(
    "❌ Unhandled promise rejection:",
    reason,
  );
  shutdown("unhandledRejection");
});

void startServer();