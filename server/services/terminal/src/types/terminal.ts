export interface FileTreeNode {
    id: string;
    name: string;
    type: "file" | "folder";
    extension: string;
    language: string;
    content: string;
    size: number;
    children: FileTreeNode[];
}

export interface FileTreeResponse {
    success?: boolean;
    data?: FileTreeNode[];
    message?: string;
}

export interface TerminalSession {
    projectId: string;
    userId: string;
    cwd: string;
    ptyProcess: import("node-pty").IPty;
}

export interface TerminalInitPayload {
    projectId: string;
    userId: string;
    cols?: number;
    rows?: number;
}

export interface TerminalResizePayload {
    cols: number;
    rows: number;
}