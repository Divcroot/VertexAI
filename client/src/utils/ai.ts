interface ChatHistoryItem {
    role: "user" | "assistant";
    content: string;
}

interface AIEventData {
    content?: string;
    message?: string;
    command?: string;
    folder?: {
        name?: string;
    };
    file?: {
        name?: string;
    };
    [key: string]: unknown;
}

type AIEventHandler = (
    eventType: string,
    data: AIEventData,
) => void | Promise<void>;

interface ChatWithAIParams {
    projectId: string;
    message: string;
    history?: ChatHistoryItem[];
    terminalSocketId?: string | null;
    onEvent?: AIEventHandler;
}

interface AIErrorResponse {
    message?: string;
}

export const chatWithAI = async ({
    projectId,
    message,
    history = [],
    terminalSocketId = null,
    onEvent,
}: ChatWithAIParams): Promise<void> => {
    const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/ai/chat`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
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

    // HTTP-level error
    if (!response.ok) {
        let errorMessage = "AI request failed.";

        try {
            const data =
                (await response.json()) as AIErrorResponse;

            console.error(
                "AI HTTP ERROR:",
                data,
            );

            errorMessage =
                data.message || errorMessage;
        } catch {
            // Response was not JSON
        }

        throw new Error(errorMessage);
    }

    // Streaming is not available
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

            // Server closed the stream
            if (done) {
                break;
            }

            if (!value) {
                continue;
            }

            const chunk =
                decoder.decode(value, {
                    stream: true,
                });

            console.log(
                "AI SSE CHUNK:",
                chunk,
            );

            buffer += chunk;

            const events =
                buffer.split(/\r?\n\r?\n/);

            // Keep incomplete event
            buffer =
                events.pop() || "";

            for (const eventText of events) {
                if (!eventText.trim()) {
                    continue;
                }

                let eventType =
                    "message";

                let dataText = "";

                const lines =
                    eventText.split(/\r?\n/);

                for (const line of lines) {
                    if (
                        line.startsWith(
                            "event:",
                        )
                    ) {
                        eventType =
                            line
                                .slice(6)
                                .trim();
                    }

                    if (
                        line.startsWith(
                            "data:",
                        )
                    ) {
                        const data =
                            line
                                .slice(5)
                                .trim();

                        if (data) {
                            dataText += data;
                        }
                    }
                }

                if (!dataText) {
                    continue;
                }

                let data: AIEventData;

                try {
                    data =
                        JSON.parse(
                            dataText,
                        ) as AIEventData;
                } catch {
                    data = {
                        content: dataText,
                    };
                }

                console.log(
                    "AI SSE EVENT:",
                    eventType,
                    data,
                );

                // Handle backend stream errors
                if (
                    eventType === "error"
                ) {
                    const errorMessage =
                        data.message ||
                        "AI stream failed.";

                    throw new Error(
                        errorMessage,
                    );
                }

                await onEvent?.(
                    eventType,
                    data,
                );

                // Backend explicitly says the task is finished
                if (
                    eventType === "done"
                ) {
                    return;
                }
            }
        }

        // Process any final buffered event
        if (buffer.trim()) {
            let eventType =
                "message";

            let dataText = "";

            const lines =
                buffer.split(/\r?\n/);

            for (const line of lines) {
                if (
                    line.startsWith(
                        "event:",
                    )
                ) {
                    eventType =
                        line
                            .slice(6)
                            .trim();
                }

                if (
                    line.startsWith(
                        "data:",
                    )
                ) {
                    const data =
                        line
                            .slice(5)
                            .trim();

                    if (data) {
                        dataText += data;
                    }
                }
            }

            if (dataText) {
                let data: AIEventData;

                try {
                    data =
                        JSON.parse(
                            dataText,
                        ) as AIEventData;
                } catch {
                    data = {
                        content: dataText,
                    };
                }

                console.log(
                    "AI FINAL SSE EVENT:",
                    eventType,
                    data,
                );

                if (
                    eventType === "error"
                ) {
                    throw new Error(
                        data.message ||
                        "AI stream failed.",
                    );
                }

                await onEvent?.(
                    eventType,
                    data,
                );
            }
        }
    } finally {
        reader.releaseLock();
    }
};