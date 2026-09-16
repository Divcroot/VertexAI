export interface ChatHistoryItem {
    role: "user" | "assistant";
    content: string;
}

export interface AIEventData {
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

export type AIEventHandler = (
    eventType: string,
    data: AIEventData,
) => void | Promise<void>;

export interface ChatWithAIParams {
    projectId: string;
    message: string;
    history?: ChatHistoryItem[];
    terminalSocketId?: string | null;
    onEvent?: AIEventHandler;
}

export interface AIErrorResponse {
    message?: string;
}