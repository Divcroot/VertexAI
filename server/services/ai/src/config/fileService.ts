import { env } from "./env.js";

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

interface FileServiceResponse {
    success?: boolean;
    message?: string;
    data?: unknown;
    tree?: unknown;
    file?: unknown;
    [key: string]: unknown;
}

const request = async (
    url: string,
    options: RequestOptions = {},
    userId: string,
): Promise<FileServiceResponse> => {
    console.log("=================================");
    console.log(
        "FILE SERVICE REQUEST:",
        options.method || "GET",
        url,
    );
    console.log("USER ID:", userId);

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            ...(options.headers || {}),
        },
    });

    const text = await response.text();

    let data: FileServiceResponse = {};

    try {
        data = text
            ? (JSON.parse(text) as FileServiceResponse)
            : {};
    } catch {
        data = {
            message: text,
        };
    }

    console.log(
        "FILE SERVICE RESPONSE:",
        response.status,
        data,
    );

    if (!response.ok) {
        throw new Error(
            data.message ||
            `File service returned ${response.status}`,
        );
    }

    return data;
};

// Get the complete file tree of a project
export const getProjectTree = async (
    projectId: string,
    userId: string,
) => {
    if (!projectId) {
        throw new Error("projectId is required");
    }

    return request(
        `${env.FILE_SERVICE_URL}/tree/${projectId}`,
        {},
        userId,
    );
};

// Get a single file
export const getFile = async (
    fileId: string,
    userId: string,
) => {
    if (!fileId) {
        throw new Error("fileId is required");
    }

    return request(
        `${env.FILE_SERVICE_URL}/${fileId}`,
        {},
        userId,
    );
};

// Create a folder
export const createFolder = async (
    body: {
        projectId: string;
        parentId: string | null;
        name: string;
    },
    userId: string,
) => {
    if (!body.projectId) {
        throw new Error("projectId is required");
    }

    if (!body.name?.trim()) {
        throw new Error("Folder name is required");
    }

    const endpoint = body.parentId
        ? "/create-folder"
        : "/create-root-folder";

    return request(
        `${env.FILE_SERVICE_URL}${endpoint}`,
        {
            method: "POST",
            body: JSON.stringify(body),
        },
        userId,
    );
};

// Create a file
export const createFile = async (
    body: {
        projectId: string;
        parentId: string | null;
        name: string;
        extension?: string;
        language?: string;
        content?: string;
        size?: number;
    },
    userId: string,
) => {
    if (!body.projectId) {
        throw new Error("projectId is required");
    }

    if (!body.name?.trim()) {
        throw new Error("File name is required");
    }

    return request(
        `${env.FILE_SERVICE_URL}/create-file`,
        {
            method: "POST",
            body: JSON.stringify(body),
        },
        userId,
    );
};

// Update a file
export const updateFile = async (
    fileId: string,
    body: {
        content: string;
    },
    userId: string,
) => {
    if (!fileId) {
        throw new Error("fileId is required");
    }

    return request(
        `${env.FILE_SERVICE_URL}/update/${fileId}`,
        {
            method: "POST",
            body: JSON.stringify(body),
        },
        userId,
    );
};

// Delete a file
export const deleteFile = async (
    fileId: string,
    userId: string,
) => {
    if (!fileId) {
        throw new Error("fileId is required");
    }

    return request(
        `${env.FILE_SERVICE_URL}/${fileId}`,
        {
            method: "DELETE",
        },
        userId,
    );
};