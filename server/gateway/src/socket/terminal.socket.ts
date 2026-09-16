import { Server, type Socket } from "socket.io";
import {
    io as createClient,
    type Socket as ClientSocket,
} from "socket.io-client";

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

const getSession = async (
    socket: Socket,
): Promise<SessionData> => {
    const cookieHeader =
        socket.handshake.headers.cookie;

    if (!cookieHeader) {
        throw new Error("Unauthorized");
    }

    const sessionMatch = cookieHeader.match(
        /(?:^|;\s*)session=([^;]+)/,
    );

    if (!sessionMatch) {
        throw new Error("Unauthorized");
    }

    const sessionId = sessionMatch[1];

    const sessionData = await redis.get(
        `session:${sessionId}`,
    );

    if (!sessionData) {
        throw new Error(
            "Session expired or invalid",
        );
    }

    try {
        const session =
            JSON.parse(sessionData) as SessionData;

        if (
            !session.userId ||
            !session.email ||
            !session.name
        ) {
            throw new Error(
                "Invalid session data",
            );
        }

        return session;
    } catch {
        throw new Error(
            "Invalid session data",
        );
    }
};

const forwardEvent = (
    client: Socket,
    terminal: ClientSocket,
    event: string,
): void => {
    client.on(
        event,
        (...args: unknown[]) => {
            console.log(
                `GATEWAY → TERMINAL: ${event}`,
            );

            terminal.emit(
                event,
                ...args,
            );
        },
    );
};

const registerTerminalSocket = (
    io: Server,
): void => {
    io.of("/terminal").on(
        "connection",
        async (
            socket: Socket,
        ): Promise<void> => {
            let terminalSocket:
                | ClientSocket
                | undefined;

            try {
                const session =
                    await getSession(socket);

                console.log(
                    "GATEWAY TERMINAL AUTH:",
                    {
                        socketId: socket.id,
                        userId: session.userId,
                    },
                );

                terminalSocket =
                    createClient(
                        env.TERMINAL_SERVICE_URL,
                        {
                            transports: [
                                "websocket",
                            ],
                            auth: {
                                userId:
                                    session.userId,
                            },
                        },
                    );

                // =========================================
                // GATEWAY → TERMINAL CONNECTED
                // =========================================

                terminalSocket.on(
                    "connect",
                    () => {
                        console.log(
                            "GATEWAY → TERMINAL CONNECTED:",
                            terminalSocket?.id,
                        );
                    },
                );

                // =========================================
                // TERMINAL CONNECTION ERROR
                // =========================================

                terminalSocket.on(
                    "connect_error",
                    (error) => {
                        console.error(
                            "GATEWAY → TERMINAL CONNECT ERROR:",
                            error.message,
                        );

                        socket.emit(
                            "terminal:error",
                            error.message,
                        );
                    },
                );

                // =========================================
                // TERMINAL READY → BROWSER
                // =========================================

                terminalSocket.on(
                    "terminal:ready",
                    (...args: unknown[]) => {
                        console.log(
                            "TERMINAL → GATEWAY: terminal:ready",
                        );

                        socket.emit(
                            "terminal:ready",
                            ...args,
                        );
                    },
                );

                // =========================================
                // TERMINAL DATA → BROWSER
                // =========================================

                terminalSocket.on(
                    "terminal:data",
                    (...args: unknown[]) => {
                        socket.emit(
                            "terminal:data",
                            ...args,
                        );
                    },
                );

                // =========================================
                // TERMINAL CLEAR → BROWSER
                // =========================================

                terminalSocket.on(
                    "terminal:clear",
                    (...args: unknown[]) => {
                        socket.emit(
                            "terminal:clear",
                            ...args,
                        );
                    },
                );

                // =========================================
                // TERMINAL ERROR → BROWSER
                // =========================================

                terminalSocket.on(
                    "error",
                    (...args: unknown[]) => {
                        console.error(
                            "TERMINAL ERROR:",
                            ...args,
                        );

                        socket.emit(
                            "terminal:error",
                            ...args,
                        );
                    },
                );

                // =========================================
                // TERMINAL DISCONNECTED
                // =========================================

                terminalSocket.on(
                    "disconnect",
                    (reason) => {
                        console.log(
                            "GATEWAY → TERMINAL DISCONNECTED:",
                            reason,
                        );

                        if (
                            socket.connected
                        ) {
                            socket.emit(
                                "terminal:error",
                                "Terminal service disconnected",
                            );
                        }
                    },
                );

                // =========================================
                // BROWSER → TERMINAL
                // =========================================

                forwardEvent(
                    socket,
                    terminalSocket,
                    "terminal:init",
                );

                forwardEvent(
                    socket,
                    terminalSocket,
                    "terminal:write",
                );

                forwardEvent(
                    socket,
                    terminalSocket,
                    "terminal:resize",
                );
            } catch (
            error: unknown
            ) {
                console.error(
                    "GATEWAY TERMINAL ERROR:",
                    error,
                );

                socket.emit(
                    "terminal:error",
                    error instanceof Error
                        ? error.message
                        : "Unauthorized",
                );

                socket.disconnect(
                    true,
                );
            }

            socket.on(
                "disconnect",
                () => {
                    console.log(
                        "TERMINAL CLIENT DISCONNECTED:",
                        socket.id,
                    );

                    terminalSocket?.disconnect();
                },
            );
        },
    );
};

export default registerTerminalSocket;