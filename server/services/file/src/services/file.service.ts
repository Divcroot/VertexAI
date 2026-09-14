import { Types } from "mongoose";

import { AppError } from "../error/AppError.js";
import File from "../models/file.model.js";
import { buildTree } from "../utils/buildTree.js";

interface CreateRootFolderInput {
    owner: string;
    projectId: string;
    name: string;
}

interface CreateFolderInput {
    owner: string;
    projectId: string;
    parentId: string;
    name: string;
}

interface CreateFileInput {
    owner: string;
    projectId: string;
    parentId?: string | null;
    name: string;
    extension?: string;
    language?: string;
    content?: string;
    size?: number;
}

interface UpdateItemInput {
    name?: string;
    content?: string;
    extension?: string;
    language?: string;
    size?: number;
}

const validateObjectId = (
    value: string,
    fieldName: string,
): void => {
    if (!Types.ObjectId.isValid(value)) {
        throw new AppError(
            `Invalid ${fieldName}`,
            400,
        );
    }
};

const validateName = (
    name: string,
    type: "file" | "folder",
): string => {
    const trimmedName = name.trim();

    if (!trimmedName) {
        throw new AppError(
            `${type === "file" ? "File" : "Folder"} name is required`,
            400,
        );
    }

    if (trimmedName.length > 255) {
        throw new AppError(
            `${type === "file" ? "File" : "Folder"} name is too long`,
            400,
        );
    }

    return trimmedName;
};

// =====================================================
// CREATE ROOT FOLDER
// =====================================================

export const createRootFolder = async ({
    owner,
    projectId,
    name,
}: CreateRootFolderInput) => {
    validateObjectId(
        projectId,
        "Project ID",
    );

    const folderName = validateName(
        name,
        "folder",
    );

    const existingFolder =
        await File.findOne({
            owner,
            projectId,
            parentId: null,
            type: "folder",
            name: folderName,
            isDeleted: false,
        });

    if (existingFolder) {
        throw new AppError(
            "Root folder already exists",
            409,
        );
    }

    return File.create({
        owner,
        projectId,
        name: folderName,
        type: "folder",
        parentId: null,
        extension: "",
        language: "plaintext",
        content: "",
        size: 0,
    });
};

// =====================================================
// CREATE FOLDER
// =====================================================

export const createFolder = async ({
    owner,
    projectId,
    parentId,
    name,
}: CreateFolderInput) => {
    validateObjectId(
        projectId,
        "Project ID",
    );

    validateObjectId(
        parentId,
        "Parent folder ID",
    );

    const folderName = validateName(
        name,
        "folder",
    );

    const parentFolder =
        await File.findOne({
            _id: parentId,
            owner,
            projectId,
            type: "folder",
            isDeleted: false,
        });

    if (!parentFolder) {
        throw new AppError(
            "Parent folder not found",
            404,
        );
    }

    const existingFolder =
        await File.findOne({
            owner,
            projectId,
            parentId,
            type: "folder",
            name: folderName,
            isDeleted: false,
        });

    if (existingFolder) {
        throw new AppError(
            "Folder already exists",
            409,
        );
    }

    return File.create({
        owner,
        projectId,
        parentId,
        name: folderName,
        type: "folder",
        extension: "",
        language: "plaintext",
        content: "",
        size: 0,
    });
};

// =====================================================
// CREATE FILE
// =====================================================

export const createFile = async ({
    owner,
    projectId,
    parentId = null,
    name,
    extension = "",
    language = "plaintext",
    content = "",
    size = 0,
}: CreateFileInput) => {
    validateObjectId(
        projectId,
        "Project ID",
    );

    const fileName = validateName(
        name,
        "file",
    );

    if (
        parentId !== null &&
        parentId !== undefined
    ) {
        validateObjectId(
            parentId,
            "Parent folder ID",
        );

        const parentFolder =
            await File.findOne({
                _id: parentId,
                owner,
                projectId,
                type: "folder",
                isDeleted: false,
            });

        if (!parentFolder) {
            throw new AppError(
                "Parent folder not found",
                404,
            );
        }
    }

    if (
        !Number.isFinite(size) ||
        size < 0
    ) {
        throw new AppError(
            "Invalid file size",
            400,
        );
    }

    const existingFile =
        await File.findOne({
            owner,
            projectId,
            parentId,
            type: "file",
            name: fileName,
            isDeleted: false,
        });

    if (existingFile) {
        throw new AppError(
            "File already exists",
            409,
        );
    }

    return File.create({
        owner,
        projectId,
        parentId,
        name: fileName,
        type: "file",
        extension,
        language,
        content,
        size,
    });
};

// =====================================================
// UPDATE ITEM
// =====================================================

export const updateItem = async (
    itemId: string,
    owner: string,
    data: UpdateItemInput,
) => {
    validateObjectId(
        itemId,
        "Item ID",
    );

    const updateData: UpdateItemInput = {
        ...data,
    };

    if (
        typeof updateData.name === "string"
    ) {
        updateData.name = validateName(
            updateData.name,
            "file",
        );
    }

    if (
        updateData.size !== undefined &&
        (
            !Number.isFinite(updateData.size) ||
            updateData.size < 0
        )
    ) {
        throw new AppError(
            "Invalid file size",
            400,
        );
    }

    return File.findOneAndUpdate(
        {
            _id: itemId,
            owner,
            isDeleted: false,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        },
    );
};

// =====================================================
// DELETE ITEM
// =====================================================

export const deleteItem = async (
    itemId: string,
    owner: string,
) => {
    validateObjectId(
        itemId,
        "Item ID",
    );

    const item =
        await File.findOne({
            _id: itemId,
            owner,
            isDeleted: false,
        });

    if (!item) {
        return null;
    }

    // Delete the selected item.
    await File.updateOne(
        {
            _id: itemId,
            owner,
            isDeleted: false,
        },
        {
            $set: {
                isDeleted: true,
            },
        },
    );

    // Delete all descendants when deleting a folder.
    if (item.type === "folder") {
        const descendants =
            await File.find({
                owner,
                projectId: item.projectId,
                isDeleted: false,
            })
                .select("_id parentId")
                .lean();

        const deletedIds = new Set<string>(
            [item._id.toString()],
        );

        let changed = true;

        while (changed) {
            changed = false;

            for (const descendant of descendants) {
                const parentId =
                    descendant.parentId?.toString();

                if (
                    parentId &&
                    deletedIds.has(parentId) &&
                    !deletedIds.has(
                        descendant._id.toString(),
                    )
                ) {
                    deletedIds.add(
                        descendant._id.toString(),
                    );
                    changed = true;
                }
            }
        }

        await File.updateMany(
            {
                _id: {
                    $in: Array.from(
                        deletedIds,
                    ),
                },
                owner,
            },
            {
                $set: {
                    isDeleted: true,
                },
            },
        );
    }

    return File.findById(itemId);
};

// =====================================================
// GET FILE
// =====================================================

export const getFile = async (
    fileId: string,
    owner: string,
) => {
    validateObjectId(
        fileId,
        "File ID",
    );

    return File.findOne({
        _id: fileId,
        owner,
        type: "file",
        isDeleted: false,
    });
};

// =====================================================
// GET TREE
// =====================================================

export const getTree = async (
    projectId: string,
    owner: string,
) => {
    validateObjectId(
        projectId,
        "Project ID",
    );

    const files = await File.find({
        projectId,
        owner,
        isDeleted: false,
    })
        .sort({
            createdAt: 1,
        })
        .lean();

    return buildTree(files);
};