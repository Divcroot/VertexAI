export interface TextMessage {
    role: "user" | "assistant";
    content: string;
    error?: boolean;
}

export interface ToolMessage {
    role: "tool";
    toolType: string;
    detail?: string;
}

export type ChatMessage =
    | TextMessage
    | ToolMessage;