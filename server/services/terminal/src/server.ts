import dns from "node:dns";
import http from "node:http";

import { Server } from "socket.io";

import app from "./app.js";
import { env } from "./config/env.js";

import {
  registerTerminalSocket,
} from "./terminal/socket.js";

import {
  killAllSessions,
} from "./terminal/session.js";

// DNS configuration
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

// HTTP server
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

registerTerminalSocket(io);

// Server state
let isShuttingDown = false;

// Start server
const startServer = (): void => {
  server.listen(
    env.PORT,
    env.HOST,
    () => {
      console.log(
        `🚀 Terminal service running on http://${env.HOST}:${env.PORT}`,
      );
    },
  );
};

// Server startup error
server.on(
  "error",
  (error: Error) => {
    console.error(
      "❌ Terminal service failed:",
      error,
    );

    process.exit(1);
  },
);

// Graceful shutdown
const shutdown = (
  signal: string,
): void => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(
    `\n${signal} received. Shutting down gracefully...`,
  );

  // Stop accepting new Socket.IO connections.
  io.close();

  // Kill all running terminal sessions.
  killAllSessions();

  // Close the HTTP server.
  server.close(
    (error?: Error) => {
      if (error) {
        console.error(
          "❌ Error while shutting down server:",
          error,
        );

        process.exit(1);
      }

      console.log(
        "✅ Terminal service shut down successfully.",
      );

      process.exit(0);
    },
  );
};

// Process signals
process.on(
  "SIGTERM",
  () => shutdown("SIGTERM"),
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT"),
);

// Process errors
process.on(
  "uncaughtException",
  (error: Error) => {
    console.error(
      "❌ Uncaught exception:",
      error,
    );

    shutdown("uncaughtException");
  },
);

process.on(
  "unhandledRejection",
  (reason: unknown) => {
    console.error(
      "❌ Unhandled promise rejection:",
      reason,
    );

    shutdown("unhandledRejection");
  },
);

// Start
startServer();