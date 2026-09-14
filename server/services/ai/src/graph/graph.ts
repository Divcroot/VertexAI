import {
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";
import {
    END,
    START,
    MessagesAnnotation,
    StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import llm from "../config/llm.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";
import { fileTools } from "../tools/file.tool.js";
import { AppError } from "../error/AppError.js";

const MAX_MESSAGES = 8;

const isHumanMessage = (
    message: BaseMessage,
): message is HumanMessage => {
    return message instanceof HumanMessage;
};

const getRecentMessages = (
    messages: BaseMessage[] = [],
): BaseMessage[] => {
    if (messages.length <= MAX_MESSAGES) {
        return messages;
    }

    const firstUserMessage = messages.find(isHumanMessage);

    if (!firstUserMessage) {
        return messages.slice(-MAX_MESSAGES);
    }

    const recentMessages = messages.slice(
        -(MAX_MESSAGES - 1),
    );

    return [
        firstUserMessage,
        ...recentMessages,
    ];
};

interface CodingGraphContext {
    projectId: string;
    userId: string;
}

export const createCodingGraph = ({
    projectId,
    userId,
}: CodingGraphContext) => {
    // ===================================================
    // TOOLS
    // ===================================================

    const tools = fileTools({
        projectId,
        userId,
    });

    // ===================================================
    // MODEL
    // ===================================================

    const modelWithTools = llm.bindTools(tools);

    // ===================================================
    // AGENT NODE
    // ===================================================

    const agent = async (
        state: typeof MessagesAnnotation.State,
    ) => {
        const messages = state.messages ?? [];
        const recentMessages = getRecentMessages(messages);

        const promptMessages: BaseMessage[] = [
            new SystemMessage(SYSTEM_PROMPT),
            ...recentMessages,
        ];

        const response = await modelWithTools.invoke(
            promptMessages,
        );

        return {
            messages: [response],
        };
    };

    // ===================================================
    // TOOLS NODE
    // ===================================================

    const toolsNode = new ToolNode(tools);

    // ===================================================
    // ROUTER
    // ===================================================

    const shouldContinue = (
        state: typeof MessagesAnnotation.State,
    ): "tools" | typeof END => {
        const messages = state.messages ?? [];
        const lastMessage = messages[messages.length - 1];

        if (!(lastMessage instanceof AIMessage)) {
            return "tools";
        }

        const toolCalls = lastMessage.tool_calls ?? [];

        const finishTaskCall = toolCalls.find(
            (toolCall) => toolCall.name === "finish_task",
        );

        if (finishTaskCall) {
            return END;
        }

        if (toolCalls.length > 0) {
            return "tools";
        }

        throw new AppError(
            "AI agent stopped without completing the task",
            500,
        );
    };

    // ===================================================
    // GRAPH
    // ===================================================

    return new StateGraph(MessagesAnnotation)
        .addNode("agent", agent)
        .addNode("tools", toolsNode)
        .addEdge(START, "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent")
        .compile();
};