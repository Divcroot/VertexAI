import { Server, type Socket } from "socket.io";
import pty from "node-pty";

import { AppError } from "../error/AppError.js";
import type {
    TerminalInitPayload,
    TerminalResizePayload,
} from "../types/terminal.js";

import {
    syncProject,
} from "../workspace/sync.js";

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

// =================================================
// SEND TERMINAL DATA
// =================================================

const send = (
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

// =================================================
// NORMALIZE TERMINAL SIZE
// =================================================

const normalizeCols = (
    cols: number,
): number => {
    const value = Number(cols);

    if (!Number.isFinite(value)) {
        return 80;
    }

    return Math.max(
        20,
        Math.min(
            Math.floor(value),
            500,
        ),
    );
};

const normalizeRows = (
    rows: number,
): number => {
    const value = Number(rows);

    if (!Number.isFinite(value)) {
        return 30;
    }

    return Math.max(
        5,
        Math.min(
            Math.floor(value),
            200,
        ),
    );
};

// =================================================
// ERROR MESSAGE
// =================================================

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

// =================================================
// REGISTER SOCKET EVENTS
// =================================================

export const registerTerminalSocket = (
    io: Server,
): void => {
    io.on(
        "connection",
        (socket: Socket) => {
            console.log(
                "TERMINAL CONNECTED:",
                socket.id,
            );

            // ===========================================
            // INIT
            // ===========================================

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
                            userId,
                        } = payload;

                        if (!projectId) {
                            throw new AppError(
                                "Project ID is required",
                                400,
                            );
                        }

                        if (!userId) {
                            throw new AppError(
                                "User ID is required",
                                401,
                            );
                        }

                        // ---------------------------------------
                        // CLEAN EXISTING SESSION
                        // ---------------------------------------

                        const existingSession =
                            getSession(socket.id);

                        if (existingSession) {
                            killSession(
                                socket.id,
                            );
                        }

                        // ---------------------------------------
                        // TERMINAL SIZE
                        // ---------------------------------------

                        const cols =
                            normalizeCols(
                                payload.cols ?? 80,
                            );

                        const rows =
                            normalizeRows(
                                payload.rows ?? 30,
                            );

                        // ---------------------------------------
                        // SYNC PROJECT
                        // ---------------------------------------

                        const { root } =
                            await syncProject(
                                projectId,
                                userId,
                            );

                        // ---------------------------------------
                        // SPAWN SHELL
                        // ---------------------------------------

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

                        // ---------------------------------------
                        // PTY OUTPUT → SOCKET
                        // ---------------------------------------

                        ptyProcess.onData(
                            (data: string) => {
                                send(
                                    socket,
                                    data,
                                );
                            },
                        );

                        // ---------------------------------------
                        // PTY EXIT
                        // ---------------------------------------

                        ptyProcess.onExit(
                            ({
                                exitCode,
                            }): void => {
                                send(
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

                        // ---------------------------------------
                        // SAVE SESSION
                        // ---------------------------------------

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
                                socketId: socket.id,
                                projectId,
                                userId,
                                cwd: root,
                                cols,
                                rows,
                            },
                        );

                        // ---------------------------------------
                        // READY
                        // ---------------------------------------

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

                        send(
                            socket,
                            `\r\n\x1b[31m${getErrorMessage(
                                error,
                            )}\x1b[0m\r\n`,
                        );
                    }
                },
            );

            // ===========================================
            // USER INPUT
            // ===========================================

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

            // ===========================================
            // RESIZE
            // ===========================================

            socket.on(
                "terminal:resize",
                (
                    payload: TerminalResizePayload,
                ): void => {
                    const session =
                        getSession(
                            socket.id,
                        );

                    if (!session) {
                        return;
                    }

                    if (!payload) {
                        return;
                    }

                    const cols =
                        Number(payload.cols);

                    const rows =
                        Number(payload.rows);

                    if (
                        !Number.isFinite(cols) ||
                        !Number.isFinite(rows)
                    ) {
                        return;
                    }

                    const normalizedCols =
                        normalizeCols(cols);

                    const normalizedRows =
                        normalizeRows(rows);

                    try {
                        session.ptyProcess.resize(
                            normalizedCols,
                            normalizedRows,
                        );
                    } catch (error: unknown) {
                        console.error(
                            "PTY RESIZE ERROR:",
                            error,
                        );
                    }
                },
            );

            // ===========================================
            // DISCONNECT
            // ===========================================

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