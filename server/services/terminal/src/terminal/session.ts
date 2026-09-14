import type { TerminalSession } from "../types/terminal.js";

const sessions = new Map<
    string,
    TerminalSession
>();

// =================================================
// GET SESSION
// =================================================

export const getSession = (
    socketId: string,
): TerminalSession | undefined => {
    return sessions.get(socketId);
};

// =================================================
// SET SESSION
// =================================================

export const setSession = (
    socketId: string,
    session: TerminalSession,
): void => {
    sessions.set(
        socketId,
        session,
    );
};

// =================================================
// REMOVE SESSION
// =================================================

export const removeSession = (
    socketId: string,
): void => {
    sessions.delete(socketId);
};

// =================================================
// KILL SESSION
// =================================================

export const killSession = (
    socketId: string,
): void => {
    const session =
        sessions.get(socketId);

    if (!session) {
        return;
    }

    try {
        session.ptyProcess.kill();
    } catch {
        // PTY may already be closed.
    }

    sessions.delete(socketId);
};

// =================================================
// KILL ALL SESSIONS
// =================================================

export const killAllSessions =
    (): void => {
        for (const session of sessions.values()) {
            try {
                session.ptyProcess.kill();
            } catch {
                // PTY may already be closed.
            }
        }

        sessions.clear();
    };