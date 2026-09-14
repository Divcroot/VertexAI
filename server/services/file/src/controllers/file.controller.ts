import type {
    NextFunction,
    Request,
    Response,
} from "express";

import { AppError } from "../error/AppError.js";
import {
    createFile as createFileService,
    createFolder as createFolderService,
    createRootFolder as createRootFolderService,
    deleteItem as deleteItemService,
    getFile as getFileService,
    getTree as getTreeService,
    updateItem as updateItemService,
} from "../services/file.service.js";

// =====================================================
// HELPERS
// =====================================================

const getUserId = (
    req: Request,
): string => {
    const userId = req.headers["x-user-id"];

    if (
        typeof userId !== "string" ||
        !userId.trim()
    ) {
        throw new AppError(
            "User ID is required",
            401,
        );
    }

    return userId;
};

const getItemId = (
    req: Request,
    label: string,
): string => {
    const { id } = req.params as {
        id?: string;
    };

    if (
        typeof id !== "string" ||
        !id.trim()
    ) {
        throw new AppError(
            `${label} is required`,
            400,
        );
    }

    return id;
};

const getRequiredString = (
    value: unknown,
    message: string,
): string => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new AppError(
            message,
            400,
        );
    }

    return value.trim();
};

// =====================================================
// CREATE ROOT FOLDER
// =====================================================

export const createRootFolder = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);

        const projectId =
            getRequiredString(
                req.body?.projectId,
                "Project ID is required",
            );

        const name =
            getRequiredString(
                req.body?.name,
                "Folder name is required",
            );

        const folder =
            await createRootFolderService({
                owner: userId,
                projectId,
                name,
            });

        res.status(201).json({
            success: true,
            message:
                "Root folder created successfully",
            data: folder,
        });
    } catch (error: unknown) {
        next(error);
    }
};

// =====================================================
// CREATE FOLDER
// =====================================================

export const createFolder = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);

        const projectId =
            getRequiredString(
                req.body?.projectId,
                "Project ID is required",
            );

        const parentId =
            getRequiredString(
                req.body?.parentId,
                "Parent folder ID is required",
            );

        const name =
            getRequiredString(
                req.body?.name,
                "Folder name is required",
            );

        const folder =
            await createFolderService({
                owner: userId,
                projectId,
                parentId,
                name,
            });

        res.status(201).json({
            success: true,
            message:
                "Folder created successfully",
            data: folder,
        });
    } catch (error: unknown) {
        next(error);
    }
};

// =====================================================
// CREATE FILE
// =====================================================

export const createFile = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);

        const projectId =
            getRequiredString(
                req.body?.projectId,
                "Project ID is required",
            );

        const name =
            getRequiredString(
                req.body?.name,
                "File name is required",
            );

        const {
            parentId,
            extension,
            language,
            content,
            size,
        } = req.body;

        const file =
            await createFileService({
                owner: userId,
                projectId,
                parentId:
                    typeof parentId === "string" &&
                        parentId.trim()
                        ? parentId.trim()
                        : null,
                name,
                extension:
                    typeof extension === "string"
                        ? extension.trim()
                        : "",
                language:
                    typeof language === "string"
                        ? language.trim()
                        : "plaintext",
                content:
                    typeof content === "string"
                        ? content
                        : "",
                size:
                    typeof size === "number" &&
                        Number.isFinite(size) &&
                        size >= 0
                        ? size
                        : 0,
            });

        res.status(201).json({
            success: true,
            message:
                "File created successfully",
            data: file,
        });
    } catch (error: unknown) {
        next(error);
    }
};

// =====================================================
// UPDATE ITEM
// =====================================================

export const updateItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);

        const itemId = getItemId(
            req,
            "Item ID",
        );

        const {
            name,
            content,
            extension,
            language,
            size,
        } = req.body;

        const item =
            await updateItemService(
                itemId,
                userId,
                {
                    name:
                        typeof name === "string"
                            ? name.trim()
                            : undefined,
                    content:
                        typeof content === "string"
                            ? content
                            : undefined,
                    extension:
                        typeof extension === "string"
                            ? extension.trim()
                            : undefined,
                    language:
                        typeof language === "string"
                            ? language.trim()
                            : undefined,
                    size:
                        typeof size === "number" &&
                            Number.isFinite(size) &&
                            size >= 0
                            ? size
                            : undefined,
                },
            );

        if (!item) {
            throw new AppError(
                "Item not found",
                404,
            );
        }

        res.status(200).json({
            success: true,
            message:
                "Item updated successfully",
            data: item,
        });
    } catch (error: unknown) {
        next(error);
    }
};

// =====================================================
// DELETE ITEM
// =====================================================

export const deleteItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);

        const itemId = getItemId(
            req,
            "Item ID",
        );

        const item =
            await deleteItemService(
                itemId,
                userId,
            );

        if (!item) {
            throw new AppError(
                "Item not found",
                404,
            );
        }

        res.status(200).json({
            success: true,
            message:
                "Item deleted successfully",
            data: item,
        });
    } catch (error: unknown) {
        next(error);
    }
};

// =====================================================
// GET FILE
// =====================================================

export const getFile = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);

        const fileId = getItemId(
            req,
            "File ID",
        );

        const file =
            await getFileService(
                fileId,
                userId,
            );

        if (!file) {
            throw new AppError(
                "File not found",
                404,
            );
        }

        res.status(200).json({
            success: true,
            data: file,
        });
    } catch (error: unknown) {
        next(error);
    }
};

// =====================================================
// GET TREE
// =====================================================

export const getTree = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const userId = getUserId(req);

        const projectId =
            getRequiredString(
                req.params?.projectId,
                "Project ID is required",
            );

        const tree =
            await getTreeService(
                projectId,
                userId,
            );

        res.status(200).json({
            success: true,
            data: tree,
        });
    } catch (error: unknown) {
        next(error);
    }
};