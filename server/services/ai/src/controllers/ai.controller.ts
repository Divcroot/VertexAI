import type { NextFunction, Request, Response } from "express";

import {
    AIMessage,
    HumanMessage,
    type BaseMessage,
} from "@langchain/core/messages";

import { AppError } from "../error/AppError.js";
import { createCodingGraph } from "../graph/graph.js";
import { deductCredits } from "../utils/deductCredits.js";

const MAX_HISTORY_MESSAGES = 6;

// =====================================================
// HISTORY
// =====================================================

interface HistoryMessage {
    role: "user" | "assistant";
    content: string;
}

const buildHistory = (
    history: unknown,
): BaseMessage[] => {
    if (!Array.isArray(history)) {
        return [];
    }

    const recentHistory = history
        .filter(
            (item): item is HistoryMessage => {
                if (
                    typeof item !== "object" ||
                    item === null
                ) {
                    return false;
                }

                const message = item as Record<string, unknown>;

                return (
                    typeof message.content === "string" &&
                    message.content.trim().length > 0 &&
                    (
                        message.role === "user" ||
                        message.role === "assistant"
                    )
                );
            },
        )
        .slice(-MAX_HISTORY_MESSAGES);

    return recentHistory.map((item) => {
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
    if (res.writableEnded || res.destroyed) {
        return false;
    }

    try {
        const payload = JSON.stringify(data ?? {});

        res.write(`event: ${type}\n`);
        res.write(`data: ${payload}\n\n`);

        return true;
    } catch (error: unknown) {
        console.error(
            "SSE SEND ERROR:",
            error,
        );

        return false;
    }
};

// =====================================================
// MESSAGE CONTENT
// =====================================================

const getMessageContent = (
    message: BaseMessage,
): string => {
    if (typeof message.content === "string") {
        return message.content;
    }

    if (Array.isArray(message.content)) {
        return message.content
            .filter(
                (item): item is { type: "text"; text: string } =>
                    typeof item === "object" &&
                    item !== null &&
                    item.type === "text" &&
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
): unknown => {
    if (typeof content !== "string") {
        return content;
    }

    try {
        return JSON.parse(content);
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
        } = req.body as {
            projectId?: unknown;
            message?: unknown;
            history?: unknown;
        };

        if (
            typeof projectId !== "string" ||
            !projectId.trim()
        ) {
            throw new AppError(
                "projectId is required",
                400,
            );
        }

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            throw new AppError(
                "message is required",
                400,
            );
        }

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

            console.log(
                "AI CLIENT DISCONNECTED",
            );
        });

        // =================================================
        // START EVENT
        // =================================================

        sendEvent(res, "start", {
            success: true,
            message: "AI started",
        });

        // =================================================
        // GRAPH
        // =================================================

        const graph = createCodingGraph({
            projectId,
            userId,
        });

        // =================================================
        // MESSAGE HISTORY
        // =================================================

        const messages = buildHistory(history);

        messages.push(
            new HumanMessage(
                message.trim(),
            ),
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

        await deductCredits(userId, 10);

        let finalMessage = "";

        // =================================================
        // PROCESS GRAPH UPDATES
        // =================================================

        for await (const chunk of stream) {
            if (
                disconnected ||
                res.writableEnded
            ) {
                console.log(
                    "GRAPH STOPPED - CLIENT DISCONNECTED",
                );

                break;
            }

            // =============================================
            // AGENT UPDATE
            // =============================================

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

                // -----------------------------------------
                // TOOL CALLS
                // -----------------------------------------

                if (
                    lastMessage instanceof AIMessage &&
                    lastMessage.tool_calls?.length
                ) {
                    for (
                        const toolCall
                        of lastMessage.tool_calls
                    ) {
                        console.log(
                            "SSE -> tool_start:",
                            toolCall.name,
                        );

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

                // -----------------------------------------
                // AI RESPONSE
                // -----------------------------------------

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

            // =============================================
            // TOOL UPDATE
            // =============================================

            if (chunk.tools) {
                const toolMessages =
                    chunk.tools.messages ?? [];

                for (
                    const toolMessage
                    of toolMessages
                ) {
                    const result =
                        parseToolResult(
                            toolMessage.content,
                        );

                    // -------------------------------------
                    // FILE OPERATION
                    // -------------------------------------

                    if (
                        typeof result === "object" &&
                        result !== null &&
                        "operation" in result
                    ) {
                        const operation =
                            (
                                result as {
                                    operation: string;
                                }
                            ).operation;

                        console.log(
                            "SSE ->",
                            operation,
                        );

                        sendEvent(
                            res,
                            operation,
                            result,
                        );

                        continue;
                    }

                    // -------------------------------------
                    // COMMAND RESULT
                    // -------------------------------------

                    if (
                        typeof result === "object" &&
                        result !== null &&
                        (
                            "command" in result ||
                            "output" in result ||
                            "stdout" in result ||
                            "stderr" in result ||
                            "exitCode" in result
                        )
                    ) {
                        console.log(
                            "SSE -> command_result",
                        );

                        sendEvent(
                            res,
                            "command_result",
                            result,
                        );

                        continue;
                    }

                    // -------------------------------------
                    // GENERIC TOOL RESULT
                    // -------------------------------------

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
        // DONE
        // =================================================

        if (
            !disconnected &&
            !res.writableEnded
        ) {
            console.log(
                "SSE -> done",
            );

            sendEvent(
                res,
                "done",
                {
                    success: true,
                    message:
                        finalMessage || "Done.",
                },
            );

            res.end();
        }
    } catch (error: unknown) {
        console.error(
            "AI STREAM ERROR:",
            error,
        );

        if (disconnected) {
            return;
        }

        // ================================================
        // SSE ERROR
        // ================================================

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

        // ================================================
        // NORMAL HTTP ERROR
        // ================================================

        next(error);
    }
};