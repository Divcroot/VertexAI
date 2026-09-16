import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    chatWithAI,
} from "../services/ai/ai.service";

import type {
    AIEventData,
} from "../services/ai/ai.types";

import type {
    ChatMessage,
    TextMessage,
} from "../components/ai/ai-chat.types";

interface UseAiChatParams {
    projectId: string;
    terminalSocketId?: string | null;
    refreshTree: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const useAiChat = ({
    projectId,
    terminalSocketId = null,
    refreshTree,
    refreshUser,
}: UseAiChatParams) => {
    const [loading, setLoading] =
        useState(false);

    const [input, setInput] =
        useState("");

    const [messages, setMessages] =
        useState<ChatMessage[]>([]);

    const messagesEndRef =
        useRef<HTMLDivElement | null>(
            null,
        );

    const textareaRef =
        useRef<HTMLTextAreaElement | null>(
            null,
        );

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView(
            {
                behavior: "smooth",
            },
        );
    }, [messages, loading]);

    useEffect(() => {
        const element =
            textareaRef.current;

        if (!element) {
            return;
        }

        element.style.height = "auto";

        element.style.height = `${Math.min(
            element.scrollHeight,
            140,
        )}px`;
    }, [input]);

    const pushToolBadge = useCallback(
        (
            toolType: string,
            detail?: string,
        ): void => {
            setMessages((prev) => [
                ...prev,
                {
                    role: "tool",
                    toolType,
                    detail,
                },
            ]);
        },
        [],
    );

    const updateAssistantMessage =
        useCallback(
            (
                content: string,
                error = false,
            ): void => {
                setMessages((prev) => {
                    const updated = [
                        ...prev,
                    ];

                    const lastMessage =
                        updated[
                        updated.length - 1
                        ];

                    if (
                        lastMessage?.role ===
                        "assistant"
                    ) {
                        updated[
                            updated.length - 1
                        ] = {
                            ...lastMessage,
                            content,
                            error,
                        };
                    } else {
                        updated.push({
                            role: "assistant",
                            content,
                            error,
                        });
                    }

                    return updated;
                });
            },
            [],
        );

    const handleAIEvent =
        useCallback(
            async (
                type: string,
                data: AIEventData,
            ): Promise<void> => {
                if (
                    type === "start" ||
                    type === "tool_start"
                ) {
                    return;
                }

                if (
                    type ===
                    "folder_created"
                ) {
                    pushToolBadge(
                        "folder_created",
                        data.folder?.name,
                    );

                    await refreshTree();

                    return;
                }

                if (
                    type ===
                    "file_created"
                ) {
                    pushToolBadge(
                        "file_created",
                        data.file?.name,
                    );

                    await refreshTree();

                    return;
                }

                if (
                    type ===
                    "file_updated"
                ) {
                    pushToolBadge(
                        "file_updated",
                        data.file?.name,
                    );

                    await refreshTree();

                    return;
                }

                if (type === "file_deleted") {
                    pushToolBadge(
                        "file_deleted",
                        data.file?.name,
                    );

                    await refreshTree();

                    return;
                }

                if (
                    type === "message" ||
                    type === "token"
                ) {
                    const content =
                        data.content || "";

                    if (!content) {
                        return;
                    }

                    setMessages((prev) => {
                        const updated = [
                            ...prev,
                        ];

                        const lastMessage =
                            updated[
                            updated.length -
                            1
                            ];

                        if (
                            lastMessage?.role ===
                            "assistant"
                        ) {
                            updated[
                                updated.length -
                                1
                            ] = {
                                ...lastMessage,
                                content:
                                    type ===
                                        "token"
                                        ? lastMessage.content +
                                        content
                                        : content,
                                error: false,
                            };
                        }

                        return updated;
                    });

                    return;
                }

                if (
                    type === "error"
                ) {
                    updateAssistantMessage(
                        data.message ||
                        "AI request failed.",
                        true,
                    );

                    return;
                }

                if (
                    type === "done"
                ) {
                    console.log(
                        "AI stream completed",
                    );

                    await refreshUser();
                }
            },
            [
                pushToolBadge,
                refreshTree,
                updateAssistantMessage,
                refreshUser,
            ],
        );

    const sendMessage =
        useCallback(
            async (): Promise<void> => {
                const trimmedInput =
                    input.trim();

                if (
                    !trimmedInput ||
                    loading
                ) {
                    return;
                }

                const history =
                    messages
                        .filter(
                            (
                                message,
                            ): message is TextMessage =>
                                message.role ===
                                "user" ||
                                message.role ===
                                "assistant",
                        )
                        .map(
                            (message) => ({
                                role:
                                    message.role,
                                content:
                                    message.content,
                            }),
                        );

                setMessages((prev) => [
                    ...prev,
                    {
                        role: "user",
                        content:
                            trimmedInput,
                    },
                    {
                        role: "assistant",
                        content: "",
                    },
                ]);

                setInput("");
                setLoading(true);

                try {
                    await chatWithAI({
                        projectId,
                        message:
                            trimmedInput,
                        history,
                        terminalSocketId,
                        onEvent:
                            handleAIEvent,
                    });
                } catch (
                error: unknown
                ) {
                    console.error(
                        "AI chat error:",
                        error,
                    );

                    const message =
                        error instanceof
                            Error
                            ? error.message
                            : "Something went wrong while processing your request.";

                    updateAssistantMessage(
                        message,
                        true,
                    );
                } finally {
                    setLoading(false);
                }
            },
            [
                input,
                loading,
                messages,
                projectId,
                terminalSocketId,
                handleAIEvent,
                updateAssistantMessage,
            ],
        );

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLTextAreaElement>,
    ): void => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            void sendMessage();
        }
    };

    return {
        loading,
        input,
        messages,
        textareaRef,
        messagesEndRef,
        setInput,
        sendMessage,
        handleKeyDown,
    };
};