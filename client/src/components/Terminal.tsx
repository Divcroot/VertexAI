import { Eraser } from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    io,
    type Socket,
} from "socket.io-client";
import {
    Terminal as XTerminal,
} from "xterm";
import {
    FitAddon,
} from "xterm-addon-fit";

import "xterm/css/xterm.css";

// =================================================
// TYPES
// =================================================

interface TerminalProps {
    projectId: string;
    userId: string | undefined;
    onSocketReady?: (
        socketId: string | undefined,
    ) => void;
}

interface TerminalReadyPayload {
    cols: number;
    rows: number;
}

interface TerminalResizePayload {
    cols: number;
    rows: number;
}

// =================================================
// COMPONENT
// =================================================

const Terminal = ({
    projectId,
    userId,
    onSocketReady,
}: TerminalProps) => {
    // =================================================
    // REFS
    // =================================================

    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const socketRef =
        useRef<Socket | null>(null);

    const terminalRef =
        useRef<XTerminal | null>(null);

    const fitAddonRef =
        useRef<FitAddon | null>(null);

    const callbackRef =
        useRef<
            ((socketId: string | undefined) => void) |
            undefined
        >(onSocketReady);

    // =================================================
    // STATE
    // =================================================

    const [connected, setConnected] =
        useState<boolean>(false);

    // =================================================
    // SOCKET CALLBACK
    // =================================================

    useEffect(() => {
        callbackRef.current =
            onSocketReady;
    }, [onSocketReady]);

    // =================================================
    // TERMINAL SETUP
    // =================================================

    useEffect(() => {
        const container =
            containerRef.current;

        if (
            !container ||
            !projectId ||
            !userId
        ) {
            return;
        }

        // =================================================
        // CREATE XTERM
        // =================================================

        const terminal =
            new XTerminal({
                cursorBlink: true,
                cursorStyle: "block",

                fontSize: 13,

                fontFamily:
                    "Menlo, Monaco, Consolas, monospace",

                scrollback: 5000,

                theme: {
                    background: "#0d0d0f",
                    foreground: "#d4d4d4",
                    cursor: "#ffffff",
                    selectionBackground:
                        "#264f78",
                },
            });

        const fitAddon =
            new FitAddon();

        terminal.loadAddon(
            fitAddon,
        );

        terminal.open(container);

        terminalRef.current =
            terminal;

        fitAddonRef.current =
            fitAddon;

        // =================================================
        // FIT TERMINAL
        // =================================================

        const fitTerminal =
            (): void => {
                try {
                    if (
                        !container
                    ) {
                        return;
                    }

                    fitAddon.fit();
                } catch (error: unknown) {
                    console.error(
                        "TERMINAL FIT ERROR:",
                        error,
                    );
                }
            };

        // Wait for browser layout
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fitTerminal();
            });
        });

        // =================================================
        // TERMINAL SERVICE URL
        // =================================================

        const terminalUrl =
            import.meta.env
                .VITE_TERMINAL_SERVICE_URL as
            | string
            | undefined;

        if (!terminalUrl) {
            terminal.write(
                "\r\n\x1b[31mVITE_TERMINAL_URL missing\x1b[0m\r\n",
            );

            return () => {
                terminal.dispose();

                terminalRef.current =
                    null;

                fitAddonRef.current =
                    null;
            };
        }

        // =================================================
        // SOCKET CONNECTION
        // =================================================

        const socket =
            io(terminalUrl, {
                transports: [
                    "websocket",
                ],
                withCredentials: true,
            });

        socketRef.current =
            socket;

        // =================================================
        // RESIZE TERMINAL
        // =================================================

        const resizeTerminal =
            (): void => {
                try {
                    if (!container) {
                        return;
                    }

                    fitAddon.fit();

                    const cols =
                        terminal.cols;

                    const rows =
                        terminal.rows;

                    if (
                        !socket.connected ||
                        cols <= 0 ||
                        rows <= 0
                    ) {
                        return;
                    }

                    const payload: TerminalResizePayload =
                    {
                        cols,
                        rows,
                    };

                    socket.emit(
                        "terminal:resize",
                        payload,
                    );
                } catch (error: unknown) {
                    console.error(
                        "TERMINAL RESIZE ERROR:",
                        error,
                    );
                }
            };

        // =================================================
        // SOCKET CONNECT
        // =================================================

        socket.on(
            "connect",
            () => {
                console.log(
                    "TERMINAL SOCKET CONNECTED:",
                    socket.id,
                );

                setConnected(true);

                callbackRef.current?.(
                    socket.id,
                );

                // Make sure XTerm dimensions
                // are ready before initializing PTY.

                fitTerminal();

                console.log(
                    "SENDING TERMINAL INIT:",
                    {
                        projectId,
                        userId,
                        cols: terminal.cols,
                        rows: terminal.rows,
                    },
                );

                socket.emit(
                    "terminal:init",
                    {
                        projectId,
                        userId,
                        cols: terminal.cols,
                        rows: terminal.rows,
                    },
                );
            },
        );

        // =================================================
        // PTY READY
        // =================================================

        socket.on(
            "terminal:ready",
            (
                data: TerminalReadyPayload,
            ) => {
                console.log(
                    "TERMINAL READY:",
                    data,
                );

                /*
                 * Backend has:
                 *
                 * 1. Synced project
                 * 2. Spawned PowerShell/bash
                 * 3. Created PTY session
                 *
                 * Now sync the final browser
                 * dimensions and focus terminal.
                 */

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resizeTerminal();

                        terminal.focus();
                    });
                });
            },
        );

        // =================================================
        // TERMINAL OUTPUT
        // =================================================

        socket.on(
            "terminal:data",
            (data: unknown) => {
                if (
                    data === undefined ||
                    data === null
                ) {
                    return;
                }

                terminal.write(
                    String(data),
                );
            },
        );

        // =================================================
        // CLEAR TERMINAL EVENT
        // =================================================

        socket.on(
            "terminal:clear",
            () => {
                terminal.clear();

                terminal.write(
                    "\x1b[2J\x1b[H",
                );

                terminal.focus();
            },
        );

        // =================================================
        // SOCKET CONNECTION ERROR
        // =================================================

        socket.on(
            "connect_error",
            (error: Error) => {
                console.error(
                    "TERMINAL SOCKET CONNECTION ERROR:",
                    error,
                );

                setConnected(false);

                terminal.write(
                    `\r\n\x1b[31m${error.message}\x1b[0m\r\n`,
                );
            },
        );

        // =================================================
        // SOCKET DISCONNECT
        // =================================================

        socket.on(
            "disconnect",
            (reason: string) => {
                console.log(
                    "TERMINAL SOCKET DISCONNECTED:",
                    reason,
                );

                setConnected(false);

                callbackRef.current?.(
                    undefined,
                );
            },
        );

        // =================================================
        // USER INPUT
        // =================================================
        //
        // XTerm captures raw keyboard input.
        //
        // Example:
        //
        // User types:
        // npm run dev
        //
        // XTerm
        //   ↓
        // terminal:onData
        //   ↓
        // Socket.IO
        //   ↓
        // PTY
        //
        // =================================================

        const disposable =
            terminal.onData(
                (data: string) => {
                    if (
                        !socket.connected
                    ) {
                        return;
                    }

                    socket.emit(
                        "terminal:write",
                        data,
                    );
                },
            );

        // =================================================
        // WINDOW RESIZE
        // =================================================

        const handleWindowResize =
            (): void => {
                resizeTerminal();
            };

        window.addEventListener(
            "resize",
            handleWindowResize,
        );

        // =================================================
        // CONTAINER RESIZE
        // =================================================

        const resizeObserver =
            new ResizeObserver(() => {
                resizeTerminal();
            });

        resizeObserver.observe(
            container,
        );

        // =================================================
        // FOCUS TERMINAL
        // =================================================

        const focusTerminal =
            (): void => {
                terminal.focus();
            };

        container.addEventListener(
            "click",
            focusTerminal,
        );

        // =================================================
        // CLEANUP
        // =================================================

        return () => {

            window.removeEventListener(
                "resize",
                handleWindowResize,
            );

            resizeObserver.disconnect();

            container.removeEventListener(
                "click",
                focusTerminal,
            );

            disposable.dispose();

            callbackRef.current?.(
                undefined,
            );

            socket.disconnect();

            terminal.dispose();

            socketRef.current = null;

            terminalRef.current = null;

            fitAddonRef.current = null;

            setConnected(false);
        };
    }, [
        projectId,
        userId,
    ]);

    // =================================================
    // CLEAR TERMINAL
    // =================================================

    const clearTerminal =
        (): void => {
            const terminal = terminalRef.current;

            if (!terminal) {
                return;
            }

            terminal.clear();

            terminal.write(
                "\x1b[2J\x1b[H",
            );

            terminal.focus();
        };

    // =================================================
    // UI
    // =================================================

    return (
        <div className="flex h-full flex-col bg-[#0d0d0f]">
            {/* STATUS BAR */}

            <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/5 px-3">
                <div className="flex items-center gap-2">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${connected
                                ? "bg-emerald-400"
                                : "bg-zinc-600"
                            }`}
                    />

                    <span className="text-[11px] text-zinc-500">
                        {connected
                            ? "powershell — connected"
                            : "powershell — disconnected"}
                    </span>
                </div>

                <button
                    type="button"
                    title="Clear terminal"
                    onClick={
                        clearTerminal
                    }
                    className="rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <Eraser size={12} />
                </button>
            </div>

            {/* XTERM CONTAINER */}

            <div
                ref={containerRef}
                className="min-h-0 flex-1 cursor-text overflow-hidden"
            />
        </div>
    );
};

export default Terminal;