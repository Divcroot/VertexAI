import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    AIMessage,
    HumanMessage,
    type BaseMessage,
} from "@langchain/core/messages";

import { AppError } from "../error/AppError.js";
import { createCodingGraph } from "../graph/graph.js";
import { deductCredits } from "../utils/deductCredits.js";

const MAX_HISTORY_MESSAGES = 6;
const CHAT_CREDIT_COST = 10;

// =====================================================
// TYPES
// =====================================================

interface HistoryMessage {
    role: "user" | "assistant";
    content: string;
}

interface ChatRequestBody {
    projectId?: unknown;
    message?: unknown;
    history?: unknown;
}

interface ToolResult {
    success?: boolean;
    operation?: string;
    [key: string]: unknown;
}

// =====================================================
// HISTORY
// =====================================================

const isHistoryMessage = (
    value: unknown,
): value is HistoryMessage => {
    if (
        typeof value !== "object" ||
        value === null
    ) {
        return false;
    }

    const message = value as Record<string, unknown>;

    return (
        (message.role === "user" ||
            message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0
    );
};

const buildHistory = (
    history: unknown,
): BaseMessage[] => {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter(isHistoryMessage)
        .slice(-MAX_HISTORY_MESSAGES)
        .map((item) => {
            if (item.role === "user") {
                return new HumanMessage(item.content);
            }

            return new AIMessage(item.content);
        });
};

// =====================================================
// SSE
// =====================================================

const sendEvent = (
    res: Response,
    type: string,
    data: unknown,
): boolean => {
    if (
        res.writableEnded ||
        res.destroyed
    ) {
        return false;
    }

    try {
        res.write(`event: ${type}\n`);
        res.write(
            `data: ${JSON.stringify(data ?? {})}\n\n`,
        );

        return true;
    } catch {
        return false;
    }
};

// =====================================================
// MESSAGE CONTENT
// =====================================================

const getMessageContent = (
    message: BaseMessage,
): string => {
    if (
        typeof message.content === "string"
    ) {
        return message.content;
    }

    if (
        Array.isArray(message.content)
    ) {
        return message.content
            .filter(
                (
                    item,
                ): item is {
                    type: "text";
                    text: string;
                } =>
                    typeof item === "object" &&
                    item !== null &&
                    "type" in item &&
                    item.type === "text" &&
                    "text" in item &&
                    typeof item.text === "string",
            )
            .map((item) => item.text)
            .join("");
    }

    return "";
};

// =====================================================
// TOOL RESULT
// =====================================================

const parseToolResult = (
    content: unknown,
): ToolResult | null => {
    if (
        typeof content !== "string"
    ) {
        return null;
    }

    try {
        const parsed: unknown =
            JSON.parse(content);

        if (
            typeof parsed !== "object" ||
            parsed === null
        ) {
            return null;
        }

        return parsed as ToolResult;
    } catch {
        return null;
    }
};

// =====================================================
// CHAT
// =====================================================

export const chat = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    let disconnected = false;

    try {
        // =================================================
        // USER
        // =================================================

        const userId = req.headers["x-user-id"];

        if (
            !userId ||
            typeof userId !== "string"
        ) {
            throw new AppError(
                "User ID is required",
                401,
            );
        }

        // =================================================
        // REQUEST
        // =================================================

        const {
            projectId,
            message,
            history = [],
        } = req.body as ChatRequestBody;

        if (
            typeof projectId !== "string" ||
            !projectId.trim()
        ) {
            throw new AppError(
                "Project ID is required",
                400,
            );
        }

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            throw new AppError(
                "Message is required",
                400,
            );
        }

        // =================================================
        // SESSION
        // =================================================

        const sessionCookie = req.headers.cookie;

        if (
            !sessionCookie ||
            typeof sessionCookie !== "string"
        ) {
            throw new AppError(
                "Session is required",
                401,
            );
        }

        // =================================================
        // DEDUCT CHAT CREDITS
        // =================================================

        const creditResult = await deductCredits(
            userId,
            CHAT_CREDIT_COST,
            sessionCookie,
        );

        // =================================================
        // SSE HEADERS
        // =================================================

        res.setHeader(
            "Content-Type",
            "text/event-stream; charset=utf-8",
        );

        res.setHeader(
            "Cache-Control",
            "no-cache, no-transform",
        );

        res.setHeader(
            "Connection",
            "keep-alive",
        );

        res.setHeader(
            "X-Accel-Buffering",
            "no",
        );

        res.flushHeaders?.();

        // =================================================
        // CLIENT DISCONNECT
        // =================================================

        res.once("close", () => {
            disconnected = true;
        });

        // =================================================
        // START
        // =================================================

        sendEvent(res, "start", {
            success: true,
            message: "AI started",
            credits: creditResult.credits,
            deducted: CHAT_CREDIT_COST,
        });

        // =================================================
        // GRAPH
        // =================================================

        const graph = createCodingGraph({
            projectId: projectId.trim(),
            userId,
        });

        // =================================================
        // MESSAGES
        // =================================================

        const messages = buildHistory(history);

        messages.push(
            new HumanMessage(message.trim()),
        );

        // =================================================
        // GRAPH STREAM
        // =================================================

        const stream = await graph.stream(
            {
                messages,
            },
            {
                streamMode: "updates",
                recursionLimit: 40,
            },
        );

        let finalMessage = "";
        let taskCompleted = false;

        // =================================================
        // PROCESS GRAPH
        // =================================================

        for await (const chunk of stream) {
            if (
                disconnected ||
                res.writableEnded
            ) {
                break;
            }

            // ===============================================
            // AGENT UPDATE
            // ===============================================

            if (chunk.agent) {
                const agentMessages =
                    chunk.agent.messages ?? [];

                const lastMessage =
                    agentMessages[
                    agentMessages.length - 1
                    ];

                if (!lastMessage) {
                    continue;
                }

                // ---------------------------------------------
                // TOOL CALLS
                // ---------------------------------------------

                if (
                    lastMessage instanceof AIMessage &&
                    lastMessage.tool_calls?.length
                ) {
                    for (
                        const toolCall of
                        lastMessage.tool_calls
                    ) {
                        if (
                            toolCall.name ===
                            "finish_task"
                        ) {
                            continue;
                        }

                        sendEvent(
                            res,
                            "tool_start",
                            {
                                tool: toolCall.name,
                                args:
                                    toolCall.args ?? {},
                            },
                        );
                    }

                    continue;
                }

                // ---------------------------------------------
                // AI MESSAGE
                // ---------------------------------------------

                const content =
                    getMessageContent(
                        lastMessage,
                    );

                if (content) {
                    finalMessage = content;

                    sendEvent(
                        res,
                        "message",
                        {
                            content,
                        },
                    );
                }
            }

            // ===============================================
            // TOOL UPDATE
            // ===============================================

            if (chunk.tools) {
                const toolMessages =
                    chunk.tools.messages ?? [];

                for (
                    const toolMessage of
                    toolMessages
                ) {
                    const result =
                        parseToolResult(
                            toolMessage.content,
                        );

                    if (!result) {
                        sendEvent(
                            res,
                            "tool_result",
                            {
                                content:
                                    typeof toolMessage.content ===
                                        "string"
                                        ? toolMessage.content
                                        : JSON.stringify(
                                            toolMessage.content,
                                        ),
                            },
                        );

                        continue;
                    }

                    // -------------------------------------------
                    // TASK COMPLETED
                    // -------------------------------------------

                    if (
                        result.operation ===
                        "task_completed"
                    ) {
                        taskCompleted = true;

                        if (
                            typeof result.summary ===
                            "string"
                        ) {
                            finalMessage =
                                result.summary;
                        }

                        continue;
                    }

                    // -------------------------------------------
                    // FILE OPERATION
                    // -------------------------------------------

                    if (
                        typeof result.operation ===
                        "string"
                    ) {
                        sendEvent(
                            res,
                            result.operation,
                            result,
                        );

                        continue;
                    }

                    // -------------------------------------------
                    // COMMAND RESULT
                    // -------------------------------------------

                    if (
                        "command" in result ||
                        "output" in result ||
                        "stdout" in result ||
                        "stderr" in result ||
                        "exitCode" in result
                    ) {
                        sendEvent(
                            res,
                            "command_result",
                            result,
                        );

                        continue;
                    }

                    // -------------------------------------------
                    // GENERIC TOOL RESULT
                    // -------------------------------------------

                    sendEvent(
                        res,
                        "tool_result",
                        {
                            content:
                                typeof toolMessage.content ===
                                    "string"
                                    ? toolMessage.content
                                    : JSON.stringify(
                                        toolMessage.content,
                                    ),
                        },
                    );
                }
            }
        }

        // =================================================
        // COMPLETION
        // =================================================

        if (
            disconnected ||
            res.writableEnded
        ) {
            return;
        }

        if (!taskCompleted) {
            throw new AppError(
                "AI agent stopped before completing the task",
                500,
            );
        }

        sendEvent(
            res,
            "done",
            {
                success: true,
                message:
                    finalMessage ||
                    "Project completed.",
                credits: creditResult.credits,
                deducted: CHAT_CREDIT_COST,
            },
        );

        res.end();
    } catch (error: unknown) {
        if (disconnected) {
            return;
        }

        if (res.headersSent) {
            const message =
                error instanceof Error
                    ? error.message
                    : "AI request failed.";

            sendEvent(
                res,
                "error",
                {
                    success: false,
                    message,
                },
            );

            if (!res.writableEnded) {
                res.end();
            }

            return;
        }

        next(error);
    }
};