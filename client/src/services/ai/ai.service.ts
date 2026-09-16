import {
    parseSSEEvent,
    splitSSEBuffer,
} from "./ai.sse.js";

import type {
    AIErrorResponse,
    ChatWithAIParams,
} from "./ai.types.js";

const AI_URL =
    `${import.meta.env.VITE_SERVER_URL}/api/ai/chat`;

export const chatWithAI = async ({
    projectId,
    message,
    history = [],
    terminalSocketId = null,
    onEvent,
}: ChatWithAIParams): Promise<void> => {
    const response = await fetch(
        AI_URL,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json",
                Accept: "text/event-stream",
            },

            credentials: "include",

            body: JSON.stringify({
                projectId,
                message,
                history,
                terminalSocketId,
            }),
        },
    );

    if (!response.ok) {
        let errorMessage =
            "AI request failed.";

        try {
            const data =
                (await response.json()) as AIErrorResponse;

            console.error(
                "AI HTTP ERROR:",
                data,
            );

            errorMessage =
                data.message ||
                errorMessage;
        } catch {
            // Response was not JSON.
        }

        throw new Error(
            errorMessage,
        );
    }

    if (!response.body) {
        throw new Error(
            "AI streaming is not supported.",
        );
    }

    const reader =
        response.body.getReader();

    const decoder =
        new TextDecoder();

    let buffer = "";

    try {
        while (true) {
            const {
                value,
                done,
            } = await reader.read();

            if (done) {
                break;
            }

            if (!value) {
                continue;
            }

            buffer += decoder.decode(
                value,
                {
                    stream: true,
                },
            );

            const {
                events,
                remaining,
            } = splitSSEBuffer(
                buffer,
            );

            buffer = remaining;

            for (const eventText of events) {
                const event =
                    parseSSEEvent(
                        eventText,
                    );

                if (!event) {
                    continue;
                }

                console.log(
                    "AI SSE EVENT:",
                    event.eventType,
                    event.data,
                );

                if (
                    event.eventType ===
                    "error"
                ) {
                    throw new Error(
                        event.data.message ||
                        "AI stream failed.",
                    );
                }

                await onEvent?.(
                    event.eventType,
                    event.data,
                );

                if (
                    event.eventType ===
                    "done"
                ) {
                    return;
                }
            }
        }

        // Handle the final incomplete buffer.
        if (buffer.trim()) {
            const event =
                parseSSEEvent(
                    buffer,
                );

            if (!event) {
                return;
            }

            console.log(
                "AI FINAL SSE EVENT:",
                event.eventType,
                event.data,
            );

            if (
                event.eventType ===
                "error"
            ) {
                throw new Error(
                    event.data.message ||
                    "AI stream failed.",
                );
            }

            await onEvent?.(
                event.eventType,
                event.data,
            );
        }
    } finally {
        reader.releaseLock();
    }
};