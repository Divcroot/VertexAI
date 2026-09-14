import { Server, type Socket } from "socket.io";
import { io as createClient, type Socket as ClientSocket } from "socket.io-client";
import redis from "../../../shared/redis/index.js";
import { env } from "../config/env.js";

interface SessionData {
    userId: string;
    name: string;
    email: string;
    avatar: string;
    credits: number;
    plan: "free" | "pro" | "team";
}

const getSession = async (socket: Socket): Promise<SessionData> => {
    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
        throw new Error("Unauthorized");
    }

    const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);

    if (!sessionMatch) {
        throw new Error("Unauthorized");
    }

    const sessionId = sessionMatch[1];

    const sessionData = await redis.get(`session:${sessionId}`);

    if (!sessionData) {
        throw new Error("Session expired or invalid");
    }

    try {
        const session = JSON.parse(sessionData) as SessionData;

        if (!session.userId || !session.email || !session.name) {
            throw new Error("Invalid session data");
        }

        return session;
    } catch {
        throw new Error("Invalid session data");
    }
};

const forwardEvent = (
    client: Socket,
    terminal: ClientSocket,
    event: string,
): void => {
    client.on(event, (...args: unknown[]) => {
        terminal.emit(event, ...args);
    });
};

const registerTerminalSocket = (io: Server): void => {
    io.of("/terminal").on("connection", async (socket) => {
        let terminalSocket: ClientSocket | undefined;

        try {
            const session = await getSession(socket);

            terminalSocket = createClient(env.TERMINAL_SERVICE_URL, {
                transports: ["websocket"],
                auth: {
                    userId: session.userId,
                },
            });

            terminalSocket.on("connect", () => {
                socket.emit("connect_ready");
            });

            terminalSocket.on("ready", (...args: unknown[]) => {
                socket.emit("ready", ...args);
            });

            terminalSocket.on("output", (...args: unknown[]) => {
                socket.emit("output", ...args);
            });

            terminalSocket.on("error", (...args: unknown[]) => {
                socket.emit("error", ...args);
            });

            terminalSocket.on("exit", (...args: unknown[]) => {
                socket.emit("exit", ...args);
            });

            terminalSocket.on("disconnect", (reason) => {
                socket.emit("terminal_disconnect", reason);
            });

            forwardEvent(socket, terminalSocket, "terminal:init");
            forwardEvent(socket, terminalSocket, "terminal:write");
            forwardEvent(socket, terminalSocket, "terminal:resize");
        } catch {
            socket.emit("error", "Unauthorized");
            socket.disconnect(true);
        }

        socket.on("disconnect", () => {
            terminalSocket?.disconnect();
        });
    });
};

export default registerTerminalSocket;