import { Server, type Socket } from "socket.io";
import pty from "node-pty";

import { AppError } from "../error/AppError.js";
import type {
    TerminalInitPayload,
    TerminalResizePayload,
} from "../types/terminal.js";
import { syncProject } from "../workspace/sync.js";

import {
    getSession,
    setSession,
    killSession,
    removeSession,
} from "./session.js";

const SHELL =
    process.platform === "win32"
        ? "powershell.exe"
        : "bash";

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 30;

const MIN_COLS = 20;
const MAX_COLS = 500;

const MIN_ROWS = 5;
const MAX_ROWS = 200;

// Send terminal data
const sendTerminalData = (
    socket: Socket,
    data: unknown,
): void => {
    if (!socket.connected) {
        return;
    }

    socket.emit(
        "terminal:data",
        String(data ?? ""),
    );
};

// Normalize terminal columns
const normalizeCols = (
    cols: number,
): number => {
    if (!Number.isFinite(cols)) {
        return DEFAULT_COLS;
    }

    return Math.max(
        MIN_COLS,
        Math.min(
            Math.floor(cols),
            MAX_COLS,
        ),
    );
};

// Normalize terminal rows
const normalizeRows = (
    rows: number,
): number => {
    if (!Number.isFinite(rows)) {
        return DEFAULT_ROWS;
    }

    return Math.max(
        MIN_ROWS,
        Math.min(
            Math.floor(rows),
            MAX_ROWS,
        ),
    );
};

// Get error message
const getErrorMessage = (
    error: unknown,
): string => {
    if (error instanceof AppError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Terminal operation failed";
};

// Register terminal socket events
export const registerTerminalSocket = (
    io: Server,
): void => {
    io.use((socket, next) => {
        const userId = socket.handshake.auth?.userId;

        if (
            typeof userId !== "string" ||
            !userId.trim()
        ) {
            next(new Error("Unauthorized"));
            return;
        }

        socket.data.userId = userId;

        next();
    });

    io.on(
        "connection",
        (socket: Socket) => {
            console.log(
                "TERMINAL CONNECTED:",
                socket.id,
            );

            // Initialize terminal
            socket.on(
                "terminal:init",
                async (
                    payload: TerminalInitPayload,
                ): Promise<void> => {
                    try {
                        if (!payload) {
                            throw new AppError(
                                "Terminal initialization data is required",
                                400,
                            );
                        }

                        const {
                            projectId,
                        } = payload;

                        const userId =
                            socket.data.userId;

                        if (
                            typeof projectId !==
                            "string" ||
                            !projectId.trim()
                        ) {
                            throw new AppError(
                                "Project ID is required",
                                400,
                            );
                        }

                        if (
                            typeof userId !==
                            "string" ||
                            !userId.trim()
                        ) {
                            throw new AppError(
                                "Unauthorized",
                                401,
                            );
                        }

                        // Clean existing session
                        const existingSession =
                            getSession(socket.id);

                        if (existingSession) {
                            killSession(
                                socket.id,
                            );
                        }

                        // Terminal size
                        const cols =
                            normalizeCols(
                                payload.cols ??
                                DEFAULT_COLS,
                            );

                        const rows =
                            normalizeRows(
                                payload.rows ??
                                DEFAULT_ROWS,
                            );

                        // Sync project workspace
                        const { root } =
                            await syncProject(
                                projectId,
                                userId,
                            );

                        // Socket may have disconnected
                        // while the project was syncing.
                        if (!socket.connected) {
                            return;
                        }

                        // Spawn shell
                        const ptyProcess =
                            pty.spawn(
                                SHELL,
                                [],
                                {
                                    name: "xterm-256color",
                                    cols,
                                    rows,
                                    cwd: root,
                                    env: {
                                        ...process.env,
                                        FORCE_COLOR: "1",
                                    },
                                },
                            );

                        // PTY output → Socket
                        ptyProcess.onData(
                            (data: string) => {
                                sendTerminalData(
                                    socket,
                                    data,
                                );
                            },
                        );

                        // PTY exit
                        ptyProcess.onExit(
                            ({
                                exitCode,
                            }): void => {
                                sendTerminalData(
                                    socket,
                                    `\r\n\x1b[90m[shell exited: ${exitCode}]\x1b[0m\r\n`,
                                );

                                const session =
                                    getSession(
                                        socket.id,
                                    );

                                if (
                                    session?.ptyProcess ===
                                    ptyProcess
                                ) {
                                    removeSession(
                                        socket.id,
                                    );
                                }
                            },
                        );

                        // Store session
                        setSession(
                            socket.id,
                            {
                                projectId,
                                userId,
                                cwd: root,
                                ptyProcess,
                            },
                        );

                        console.log(
                            "TERMINAL INIT:",
                            {
                                socketId:
                                    socket.id,
                                projectId,
                                userId,
                                cwd: root,
                                cols,
                                rows,
                            },
                        );

                        // Terminal ready
                        socket.emit(
                            "terminal:ready",
                            {
                                cols,
                                rows,
                            },
                        );
                    } catch (error: unknown) {
                        console.error(
                            "TERMINAL INIT ERROR:",
                            error,
                        );

                        sendTerminalData(
                            socket,
                            `\r\n\x1b[31m${getErrorMessage(
                                error,
                            )}\x1b[0m\r\n`,
                        );
                    }
                },
            );

            // Terminal input
            socket.on(
                "terminal:write",
                (data: unknown): void => {
                    const session =
                        getSession(
                            socket.id,
                        );

                    if (!session) {
                        return;
                    }

                    if (
                        data === undefined ||
                        data === null
                    ) {
                        return;
                    }

                    try {
                        session.ptyProcess.write(
                            String(data),
                        );
                    } catch (error: unknown) {
                        console.error(
                            "PTY WRITE ERROR:",
                            error,
                        );
                    }
                },
            );

            // Terminal resize
            socket.on(
                "terminal:resize",
                (
                    payload: TerminalResizePayload,
                ): void => {
                    const session =
                        getSession(
                            socket.id,
                        );

                    if (!session || !payload) {
                        return;
                    }

                    const cols = Number(
                        payload.cols,
                    );

                    const rows = Number(
                        payload.rows,
                    );

                    if (
                        !Number.isFinite(cols) ||
                        !Number.isFinite(rows)
                    ) {
                        return;
                    }

                    try {
                        session.ptyProcess.resize(
                            normalizeCols(cols),
                            normalizeRows(rows),
                        );
                    } catch (error: unknown) {
                        console.error(
                            "PTY RESIZE ERROR:",
                            error,
                        );
                    }
                },
            );

            // Disconnect
            socket.on(
                "disconnect",
                (): void => {
                    console.log(
                        "TERMINAL DISCONNECTED:",
                        socket.id,
                    );

                    killSession(
                        socket.id,
                    );
                },
            );
        },
    );
};