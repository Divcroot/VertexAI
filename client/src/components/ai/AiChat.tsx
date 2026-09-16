import {
    Loader2,
    Send,
    Sparkles,
} from "lucide-react";

import { AnimatePresence } from "motion/react";

import {
    useAiChat,
} from "../../hooks/useAiChat";

import AiMessage from "./AiMessage";
import AiToolBadge from "./AiToolBadge";
import { useFile } from "../../context/FileContext";
import { useAuth } from "../../context/AuthContext";

interface AiChatProps {
    projectId: string;
    terminalSocketId?: string | null;
}

const AiChat = ({
    projectId,
    terminalSocketId = null,
}: AiChatProps) => {

    const { refreshTree } = useFile();
    const { refreshUser } = useAuth();

    const {
        loading,
        input,
        messages,
        textareaRef,
        messagesEndRef,
        setInput,
        sendMessage,
        handleKeyDown,
    } = useAiChat({
        projectId,
        terminalSocketId,
        refreshTree,
        refreshUser,
    });

    return (
        <div className="flex h-full w-full min-w-0 max-w-80 shrink-0 flex-col overflow-hidden border-l border-white/6 bg-[#111113]/90 backdrop-blur-xl">
            {/* HEADER */}

            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/6 px-3">
                <span className="text-xs font-semibold tracking-wider text-zinc-300">
                    Vertex AI Chat
                </span>

                {loading && (
                    <span className="ml-auto flex items-center gap-1.5 text-[10.5px] text-zinc-500">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        working
                    </span>
                )}
            </div>

            {/* MESSAGES */}

            <div className="min-h-0 min-w-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-3 py-3 scrollbar-thin [scrollbar-color:rgba(100,116,139,0.35)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                {messages.length === 0 && (
                    <div className="mt-10 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/6 bg-white/2">
                            <Sparkles
                                size={22}
                                className="text-zinc-600"
                            />
                        </div>

                        <p className="text-sm font-medium text-zinc-400">
                            What do you want
                            to build?
                        </p>

                        <p className="mt-1.5 text-xs text-zinc-600">
                            Ask me to create
                            or modify files.
                        </p>
                    </div>
                )}

                <AnimatePresence initial={false}>
                    {messages.map(
                        (
                            message,
                            index,
                        ) => {
                            if (
                                message.role ===
                                "tool"
                            ) {
                                return (
                                    <AiToolBadge
                                        key={
                                            index
                                        }
                                        toolType={
                                            message.toolType
                                        }
                                        detail={
                                            message.detail
                                        }
                                    />
                                );
                            }

                            return (
                                <AiMessage
                                    key={
                                        index
                                    }
                                    message={
                                        message
                                    }
                                />
                            );
                        },
                    )}
                </AnimatePresence>

                {loading && (
                    <div className="flex items-center gap-2 pl-8 text-xs text-zinc-500">
                        <Loader2
                            size={13}
                            className="animate-spin"
                        />

                        <span>
                            AI is working...
                        </span>
                    </div>
                )}

                <div
                    ref={
                        messagesEndRef
                    }
                />
            </div>

            {/* INPUT */}

            <div className="min-w-0 border-t border-white/6 p-3">
                <div className="flex items-end gap-2 rounded-lg border border-white/8 bg-white/3 p-2 transition-colors focus-within:border-sky-400/40">
                    <textarea
                        ref={
                            textareaRef
                        }
                        value={input}
                        onChange={(
                            event,
                        ) =>
                            setInput(
                                event.target
                                    .value,
                            )
                        }
                        onKeyDown={
                            handleKeyDown
                        }
                        disabled={loading}
                        placeholder="Ask AI to build something..."
                        rows={2}
                        className="min-w-0 flex-1 resize-none overflow-y-auto bg-transparent text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600"
                    />

                    <button
                        type="button"
                        onClick={() =>
                            void sendMessage()
                        }
                        disabled={
                            loading ||
                            !input.trim()
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-linear-to-b from-sky-500 to-sky-600 text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-opacity hover:from-sky-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loading ? (
                            <Loader2
                                size={14}
                                className="animate-spin"
                            />
                        ) : (
                            <Send size={14} />
                        )}
                    </button>
                </div>

                <p className="mt-2 text-[10px] text-zinc-600">
                    Enter to send &middot;
                    Shift + Enter for new
                    line
                </p>
            </div>
        </div>
    );
};

export default AiChat;