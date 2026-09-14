import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { END, START, StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { fileTools } from "./tools.js";
import llm from "../config/llm.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";

const maxMessages = 12;

const isHumanMessage = (
    message: BaseMessage,
): message is HumanMessage => {
    return message instanceof HumanMessage;
};

const getRecentMessages = (
    messages: BaseMessage[] = [],
): BaseMessage[] => {
    if (messages.length <= maxMessages) {
        return messages;
    }

    const firstUserMessage = messages.find(isHumanMessage);

    if (!firstUserMessage) {
        return messages.slice(-maxMessages);
    }

    const recentMessages = messages.slice(-(maxMessages - 1));

    return [
        firstUserMessage,
        ...recentMessages,
    ];
};

export const createCodingGraph = ({
    projectId,
    userId,
}: {
    projectId: string;
    userId: string;
}) => {

    // TOOLS

    const tools = fileTools({
        projectId,
        userId,
    });

    // MODEL

    const modelWithTools = llm.bindTools(tools);

    // AGENT NODE

    const agent = async (
        state: typeof MessagesAnnotation.State,
    ) => {
        const allMessages = state.messages ?? [];

        const recentMessages = getRecentMessages(allMessages);

        const messages = [
            new SystemMessage(SYSTEM_PROMPT),
            ...recentMessages,
        ];

        console.log("GRAPH -> AGENT");
        console.log("GRAPH MESSAGE COUNT:", messages.length);

        const response = await modelWithTools.invoke(messages);

        const toolCalls = response.tool_calls ?? [];

        console.log(
            "AI TOOL CALLS:",
            toolCalls.map(
                (toolCall) => toolCall.name,
            ),
        );

        if (toolCalls.length > 0) {
            console.log(
                "AI TOOL ARGS:",
                toolCalls.map((toolCall) => ({
                    name: toolCall.name,
                    args: toolCall.args,
                })),
            );
        }

        return {
            messages: [response],
        };
    };

    // TOOLS NODE

    const toolsNode = new ToolNode(tools);

    // ROUTER

    const shouldContinue = (
        state: typeof MessagesAnnotation.State,
    ): "tools" | typeof END => {
        const lastMessage = state.messages[state.messages.length - 1];

        if (
            lastMessage instanceof AIMessage &&
            lastMessage.tool_calls?.length
        ) {
            return "tools";
        }

        return END;
    };

    // GRAPH

    return new StateGraph(MessagesAnnotation)
        .addNode("agent", agent)
        .addNode("tools", toolsNode)
        .addEdge(START, "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent")
        .compile();
};