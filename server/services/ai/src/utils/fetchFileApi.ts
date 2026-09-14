import axios from "axios";

import { env } from "../config/env.js";

import { AppError } from "../error/AppError.js";

interface CreateFolderInput {
    projectId: string;
    parentId: string | null;
    userId: string;
    name: string;
}

interface CreateFileInput {
    projectId: string;
    parentId: string | null;
    userId: string;
    name: string;
    extension: string;
    language: string;
    content: string;
    size: number;
}

interface UpdateItemInput {
    itemId: string;
    userId: string;
    name?: string;
    content?: string;
    extension?: string;
    language?: string;
    size?: number;
}

//Create Folder API Fetch
export const createFolder = async ({
    projectId,
    parentId,
    userId,
    name,
}: CreateFolderInput) => {
    try {
        const response = await axios.post(
            `${env.FILE_SERVICE_URL}/create-folder`,
            {
                projectId,
                parentId,
                name,
            },
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "Failed to create folder.";

            const statusCode = error.response?.status || 500;

            throw new AppError(message, statusCode);
        }

        throw new AppError("Failed to create folder.", 500);
    }
};

//Create File API Fetch
export const createFile = async ({
    projectId,
    parentId,
    userId,
    name,
    extension,
    language,
    content,
    size,
}: CreateFileInput) => {
    try {
        const response = await axios.post(
            `${env.FILE_SERVICE_URL}/create-file`,
            {
                projectId,
                parentId,
                name,
                extension,
                language,
                content,
                size,
            },
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "Failed to create file.";

            const statusCode = error.response?.status || 500;

            throw new AppError(message, statusCode);
        }

        throw new AppError("Failed to create file.", 500);
    }
};

//Create File API Fetch
export const updateItem = async ({
    itemId,
    userId,
    name,
    content,
    extension,
    language,
    size,
}: UpdateItemInput) => {
    try {
        const response = await axios.post(
            `${env.FILE_SERVICE_URL}/update/${itemId}`,
            {
                name,
                content,
                extension,
                language,
                size,
            },
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "Failed to update item.";

            const statusCode = error.response?.status || 500;

            throw new AppError(message, statusCode);
        }

        throw new AppError("Failed to update item.", 500);
    }
};

//Delete Item API Fetch
export const deleteItem = async ({
    itemId,
    userId,
}: {
    itemId: string;
    userId: string;
}) => {
    try {
        const response = await axios.delete(
            `${env.FILE_SERVICE_URL}/${itemId}`,
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "Failed to delete item.";

            const statusCode = error.response?.status || 500;

            throw new AppError(message, statusCode);
        }

        throw new AppError("Failed to delete item.", 500);
    }
};

//Get Tree API Fetch
export const getTree = async ({
    projectId,
    userId,
}: {
    projectId: string;
    userId: string;
}) => {
    try {
        const response = await axios.get(
            `${env.FILE_SERVICE_URL}/tree/${projectId}`,
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "Failed to fetch file tree.";

            const statusCode = error.response?.status || 500;

            throw new AppError(message, statusCode);
        }

        throw new AppError("Failed to fetch file tree.", 500);
    }
};

//Get File API Fetch
export const getFile = async ({
    fileId,
    userId,
}: {
    fileId: string;
    userId: string;
}) => {
    try {
        const response = await axios.get(
            `${env.FILE_SERVICE_URL}/${fileId}`,
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "Failed to fetch file.";

            const statusCode = error.response?.status || 500;

            throw new AppError(message, statusCode);
        }

        throw new AppError(
            "Failed to fetch file.", 500);
    }
};

//Create Root Folder API Fetch
export const createRootFolder = async ({
    projectId,
    userId,
    name,
}: {
    projectId: string;
    userId: string;
    name: string;
}) => {
    try {
        const response = await axios.post(
            `${env.FILE_SERVICE_URL}/create-root-folder`,
            {
                projectId,
                name,
            },
            {
                headers: {
                    "x-user-id": userId,
                },
            },
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const message = error.response?.data?.message || "Failed to create root folder.";

            const statusCode = error.response?.status || 500;

            throw new AppError(message, statusCode);
        }

        throw new AppError("Failed to create root folder.", 500);
    }
};