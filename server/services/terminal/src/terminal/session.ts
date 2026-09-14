import type { TerminalSession } from "../types/terminal.js";

const sessions = new Map<
    string,
    TerminalSession
>();

// Get session
export const getSession = (
    socketId: string,
): TerminalSession | undefined => {
    return sessions.get(socketId);
};

// Set session
export const setSession = (
    socketId: string,
    session: TerminalSession,
): void => {
    sessions.set(socketId, session);
};

// Remove session
export const removeSession = (
    socketId: string,
): void => {
    sessions.delete(socketId);
};

// Kill session
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

// Kill all sessions
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