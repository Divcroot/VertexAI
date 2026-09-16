import {
    Bot,
    User,
} from "lucide-react";
import { motion } from "motion/react";

import type {
    TextMessage,
} from "./ai-chat.types";

import MarkdownRenderer from "./MarkdownRenderer";

interface AiMessageProps {
    message: TextMessage;
}

const AiMessage = ({
    message,
}: AiMessageProps) => {
    const isUser =
        message.role === "user";

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 6,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                duration: 0.15,
            }}
            className={`flex min-w-0 max-w-full items-start gap-2 ${isUser ? "flex-row-reverse" : ""
                }`}
        >
            <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isUser
                    ? "bg-white/10 text-zinc-300"
                    : "bg-linear-to-br from-sky-400 to-violet-400 text-white"
                    }`}
            >
                {isUser ? (
                    <User size={12} />
                ) : (
                    <Bot size={12} />
                )}
            </div>

            <div
                className={`min-w-0 max-w-[85%] overflow-hidden wrap-anywhere rounded-xl px-3 py-2 text-[13px] ${isUser
                        ? "bg-linear-to-b from-sky-500 to-sky-600 text-white"
                        : message.error
                            ? "border border-red-500/20 bg-red-500/10 text-red-300"
                            : "border border-white/6 bg-white/3 text-zinc-300"
                    }`}
            >
                {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                    </p>
                ) : (
                    <MarkdownRenderer
                        content={
                            message.content
                        }
                    />
                )}
            </div>
        </motion.div>
    );
};

export default AiMessage;