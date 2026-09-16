import {
    Eraser,
} from "lucide-react";

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
import "./Terminal.css";

interface TerminalProps {
    projectId: string;
    onSocketReady?: (
        socketId: string | undefined,
    ) => void;
}

interface TerminalResizePayload {
    cols: number;
    rows: number;
}

const Terminal = ({
    projectId,
    onSocketReady,
}: TerminalProps) => {
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

    const resizeFrameRef =
        useRef<number | null>(null);

    const [connected, setConnected] =
        useState(false);

    useEffect(() => {
        callbackRef.current = onSocketReady;
    }, [onSocketReady]);

    useEffect(() => {
        const container =
            containerRef.current;

        if (!container || !projectId) {
            return;
        }

        const gatewayUrl =
            import.meta.env.VITE_SERVER_URL as
            | string
            | undefined;

        if (!gatewayUrl) {
            return;
        }

        const terminal = new XTerminal({
            cursorBlink: true,
            cursorStyle: "block",
            fontSize: 13,
            fontFamily:
                "Menlo, Monaco, Consolas, monospace",
            scrollback: 5000,
            convertEol: false,
            theme: {
                background: "#0d0d0f",
                foreground: "#d4d4d4",
                cursor: "#ffffff",
                selectionBackground: "#264f78",
            },
        });

        const fitAddon = new FitAddon();

        terminal.loadAddon(fitAddon);
        terminal.open(container);

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        const fitTerminal = (): void => {
            try {
                fitAddon.fit();
            } catch {
                // Ignore resize errors during mount/unmount.
            }
        };

        const resizeTerminal = (): void => {
            if (resizeFrameRef.current !== null) {
                cancelAnimationFrame(
                    resizeFrameRef.current,
                );
            }

            resizeFrameRef.current =
                requestAnimationFrame(() => {
                    resizeFrameRef.current = null;

                    if (
                        !terminalRef.current ||
                        !socketRef.current?.connected
                    ) {
                        return;
                    }

                    try {
                        fitAddon.fit();

                        const cols = terminal.cols;
                        const rows = terminal.rows;

                        if (
                            cols <= 0 ||
                            rows <= 0
                        ) {
                            return;
                        }

                        const payload: TerminalResizePayload = {
                            cols,
                            rows,
                        };

                        socketRef.current.emit(
                            "terminal:resize",
                            payload,
                        );
                    } catch {
                        // Ignore resize errors during layout changes.
                    }
                });
        };

        const socket = io(
            `${gatewayUrl}/terminal`,
            {
                transports: ["websocket"],
                withCredentials: true,
                autoConnect: true,
            },
        );

        socketRef.current = socket;

        socket.on(
            "connect",
            () => {
                setConnected(true);

                callbackRef.current?.(
                    socket.id,
                );

                fitTerminal();

                socket.emit(
                    "terminal:init",
                    {
                        projectId,
                        cols: terminal.cols,
                        rows: terminal.rows,
                    },
                );
            },
        );

        socket.on(
            "terminal:ready",
            () => {
                requestAnimationFrame(() => {
                    fitTerminal();
                    resizeTerminal();
                    terminal.focus();
                });
            },
        );

        socket.on(
            "terminal:data",
            (data: unknown) => {
                if (
                    data === null ||
                    data === undefined
                ) {
                    return;
                }

                terminal.write(
                    String(data),
                );
            },
        );

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

        socket.on(
            "connect_error",
            (error: Error) => {
                setConnected(false);

                terminal.write(
                    `\r\n\x1b[31mConnection error: ${error.message}\x1b[0m\r\n`,
                );
            },
        );

        socket.on(
            "disconnect",
            () => {
                setConnected(false);

                callbackRef.current?.(
                    undefined,
                );
            },
        );

        const inputDisposable =
            terminal.onData(
                (data: string) => {
                    if (!socket.connected) {
                        return;
                    }

                    socket.emit(
                        "terminal:write",
                        data,
                    );
                },
            );

        const handleWindowResize =
            (): void => {
                resizeTerminal();
            };

        window.addEventListener(
            "resize",
            handleWindowResize,
        );

        const resizeObserver =
            new ResizeObserver(() => {
                resizeTerminal();
            });

        resizeObserver.observe(container);

        const handleContainerClick =
            (): void => {
                terminal.focus();
            };

        container.addEventListener(
            "click",
            handleContainerClick,
        );

        requestAnimationFrame(() => {
            fitTerminal();
        });

        return () => {
            if (
                resizeFrameRef.current !== null
            ) {
                cancelAnimationFrame(
                    resizeFrameRef.current,
                );

                resizeFrameRef.current = null;
            }

            window.removeEventListener(
                "resize",
                handleWindowResize,
            );

            resizeObserver.disconnect();

            container.removeEventListener(
                "click",
                handleContainerClick,
            );

            inputDisposable.dispose();

            socket.removeAllListeners();
            socket.disconnect();

            terminal.dispose();

            callbackRef.current?.(
                undefined,
            );

            socketRef.current = null;
            terminalRef.current = null;
            fitAddonRef.current = null;

            setConnected(false);
        };
    }, [projectId]);

    const clearTerminal = (): void => {
        const terminal =
            terminalRef.current;

        if (!terminal) {
            return;
        }

        terminal.clear();
        terminal.write(
            "\x1b[2J\x1b[H",
        );
        terminal.focus();
    };

    return (
        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-[#0d0d0f]">
            {/* STATUS BAR */}

            <div className="flex h-7 shrink-0 items-center justify-between border-b border-white/5 px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${connected
                                ? "bg-emerald-400"
                                : "bg-zinc-600"
                            }`}
                    />

                    <span className="truncate text-[11px] text-zinc-500">
                        {connected
                            ? "powershell — connected"
                            : "powershell — disconnected"}
                    </span>
                </div>

                <button
                    type="button"
                    title="Clear terminal"
                    onClick={clearTerminal}
                    className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <Eraser size={12} />
                </button>
            </div>

            {/* XTERM */}

            <div
                ref={containerRef}
                className="terminal-container min-h-0 min-w-0 flex-1 cursor-text overflow-hidden"
            />
        </div>
    );
};

export default Terminal;
