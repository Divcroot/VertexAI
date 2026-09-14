import dns from "node:dns";

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

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

// =================================================
// HTTP SERVER
// =================================================

const server = http.createServer(
  app,
);

// =================================================
// SOCKET.IO
// =================================================

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

registerTerminalSocket(io);

// =================================================
// START SERVER
// =================================================

const startServer =
  async (): Promise<void> => {
    try {
      server.listen(
        env.PORT,
        env.HOST,
        () => {
          console.log(
            `🚀 Terminal service running on http://${env.HOST}:${env.PORT}`,
          );
        },
      );
    } catch (error: unknown) {
      console.error(
        "❌ Failed to start terminal service:",
        error,
      );

      process.exit(1);
    }
  };

// =================================================
// SHUTDOWN
// =================================================

const shutdown = (
  signal: string,
): void => {
  console.log(
    `\n${signal} received. Shutting down gracefully...`,
  );

  // Kill all running shells.
  killAllSessions();

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

// =================================================
// PROCESS SIGNALS
// =================================================

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM"),
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT"),
);

// =================================================
// PROCESS ERRORS
// =================================================

process.on(
  "uncaughtException",
  (error: Error) => {
    console.error(
      "❌ Uncaught exception:",
      error,
    );

    shutdown(
      "uncaughtException",
    );
  },
);

process.on(
  "unhandledRejection",
  (reason: unknown) => {
    console.error(
      "❌ Unhandled promise rejection:",
      reason,
    );

    shutdown(
      "unhandledRejection",
    );
  },
);

// =================================================
// START
// =================================================

void startServer();