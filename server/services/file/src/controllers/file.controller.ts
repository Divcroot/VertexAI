import type { NextFunction, Request, Response } from "express";
import { AppError } from "../error/AppError.js";
import {
    createRootFolder as createRootFolderService,
    createFolder as createFolderService,
    createFile as createFileService,
    updateItem as updateItemService,
    deleteItem as deleteItemService,
    getFile as getFileService,
    getTree as getTreeService,
} from "../services/file.service.js";

// Create a root folder inside a project
export const createRootFolder = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const { projectId, name } = req.body;

        if (!projectId) {
            throw new AppError("Project ID is required", 400);
        }

        if (!name) {
            throw new AppError("Folder name is required", 400);
        }

        const folder = await createRootFolderService({
            owner: userId,
            projectId,
            name,
        });

        res.status(201).json({
            success: true,
            message: "Root folder created successfully",
            data: folder,
        });
    } catch (error) {
        next(error);
    }
};

// Create a folder inside an existing folder
export const createFolder = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const { projectId, parentId, name } = req.body;

        if (!projectId) {
            throw new AppError("Project ID is required", 400);
        }

        if (!parentId) {
            throw new AppError("Parent folder ID is required", 400);
        }

        if (!name) {
            throw new AppError("Folder name is required", 400);
        }

        const folder = await createFolderService({
            owner: userId,
            projectId,
            parentId,
            name,
        });

        res.status(201).json({
            success: true,
            message: "Folder created successfully",
            data: folder,
        });
    } catch (error) {
        next(error);
    }
};

// Create a file inside a project
export const createFile = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const {
            projectId,
            parentId,
            name,
            extension,
            language,
            content,
            size,
        } = req.body;

        if (!projectId) {
            throw new AppError("Project ID is required", 400);
        }

        if (!name) {
            throw new AppError("File name is required", 400);
        }

        const file = await createFileService({
            owner: userId,
            projectId,
            parentId,
            name,
            extension,
            language,
            content,
            size,
        });

        res.status(201).json({
            success: true,
            message: "File created successfully",
            data: file,
        });
    } catch (error) {
        next(error);
    }
};

// Update an existing file or folder
export const updateItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const { id } = req.params as { id: string };

        if (!id) {
            throw new AppError("Item ID is required", 400);
        }

        const {
            name,
            content,
            extension,
            language,
            size,
        } = req.body;

        const item = await updateItemService(id, userId, {
            name,
            content,
            extension,
            language,
            size,
        });

        if (!item) {
            throw new AppError("Item not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Item updated successfully",
            data: item,
        });
    } catch (error) {
        next(error);
    }
};

// Soft delete an existing file or folder
export const deleteItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const { id } = req.params as { id: string };

        if (!id) {
            throw new AppError("Item ID is required", 400);
        }

        const item = await deleteItemService(id, userId);

        if (!item) {
            throw new AppError("Item not found", 404);
        }

        res.status(200).json({
            success: true,
            message: "Item deleted successfully",
            data: item,
        });
    } catch (error) {
        next(error);
    }
};

// Get a single file owned by the authenticated user
export const getFile = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const { id } = req.params as { id: string };

        if (!id) {
            throw new AppError("File ID is required", 400);
        }

        const file = await getFileService(id, userId);

        if (!file) {
            throw new AppError("File not found", 404);
        }

        res.status(200).json({
            success: true,
            data: file,
        });
    } catch (error) {
        next(error);
    }
};

// Get the file tree of a project
export const getTree = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId || typeof userId !== "string") {
            throw new AppError("User ID is required", 401);
        }

        const { projectId } = req.params as { projectId: string };

        if (!projectId) {
            throw new AppError("Project ID is required", 400);
        }

        const tree = await getTreeService(projectId, userId);

        res.status(200).json({
            success: true,
            data: tree,
        });
    } catch (error) {
        next(error);
    }
};