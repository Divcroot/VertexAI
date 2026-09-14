import http from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import { env } from "./config/env.js";
import registerTerminalSocket from "./socket/terminal.socket.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: true,
  },
});

registerTerminalSocket(io);

let isShuttingDown = false;

const startServer = (): void => {
  server.listen(env.PORT, env.HOST, () => {
    console.log(
      `🚀 Gateway service running on http://${env.HOST}:${env.PORT}`,
    );
  });
};

server.on("error", (error: Error) => {
  console.error("❌ Gateway service failed:", error);
  process.exit(1);
});

const shutdown = (signal: string): void => {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`\n${signal} received. Shutting down gracefully...`);

  io.close();

  server.close((error?: Error) => {
    if (error) {
      console.error("❌ Error while shutting down server:", error);
      process.exit(1);
    }

    console.log("✅ Gateway service shut down successfully.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught exception:", error);
  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("❌ Unhandled promise rejection:", reason);
  shutdown("unhandledRejection");
});

startServer();