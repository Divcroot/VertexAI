import File from "../models/file.model.js";
import { AppError } from "../error/AppError.js";
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

// Create a root folder inside a project
export const createRootFolder = async ({
    owner,
    projectId,
    name,
}: CreateRootFolderInput) => {
    const existingFolder = await File.findOne({
        owner,
        projectId,
        parentId: null,
        type: "folder",
        name,
        isDeleted: false,
    });

    if (existingFolder) {
        throw new AppError("Root folder already exists", 409);
    }

    const folder = await File.create({
        owner,
        projectId,
        name,
        type: "folder",
        parentId: null,
    });

    return folder;
};

// Create a folder inside an existing folder
export const createFolder = async ({
    owner,
    projectId,
    parentId,
    name,
}: CreateFolderInput) => {
    const parentFolder = await File.findOne({
        _id: parentId,
        owner,
        projectId,
        type: "folder",
        isDeleted: false,
    });

    if (!parentFolder) {
        throw new AppError("Parent folder not found", 404);
    }

    const existingFolder = await File.findOne({
        owner,
        projectId,
        parentId,
        type: "folder",
        name,
        isDeleted: false,
    });

    if (existingFolder) {
        throw new AppError("Folder already exists", 409);
    }

    const folder = await File.create({
        owner,
        projectId,
        parentId,
        name,
        type: "folder",
    });

    return folder;
};

// Create a file inside a project
export const createFile = async ({
    owner,
    projectId,
    parentId = null,
    name,
    extension,
    language,
    content,
    size,
}: CreateFileInput) => {
    if (parentId) {
        const parentFolder = await File.findOne({
            _id: parentId,
            owner,
            projectId,
            type: "folder",
            isDeleted: false,
        });

        if (!parentFolder) {
            throw new AppError("Parent folder not found", 404);
        }
    }

    const existingFile = await File.findOne({
        owner,
        projectId,
        parentId,
        type: "file",
        name,
        isDeleted: false,
    });

    if (existingFile) {
        throw new AppError("File already exists", 409);
    }

    const file = await File.create({
        owner,
        projectId,
        parentId,
        name,
        type: "file",
        extension,
        language,
        content,
        size,
    });

    return file;
};

// Update an existing file or folder
export const updateItem = async (
    itemId: string,
    owner: string,
    data: UpdateItemInput,
) => {
    const item = await File.findOneAndUpdate(
        {
            _id: itemId,
            owner,
            isDeleted: false,
        },
        data,
        {
            new: true,
            runValidators: true,
        },
    );

    return item;
};

// Soft delete an existing file or folder
export const deleteItem = async (
    itemId: string,
    owner: string,
) => {
    const item = await File.findOneAndUpdate(
        {
            _id: itemId,
            owner,
            isDeleted: false,
        },
        {
            isDeleted: true,
        },
        {
            new: true,
        },
    );

    return item;
};

// Get a single file owned by the authenticated user
export const getFile = async (
    fileId: string,
    owner: string,
) => {
    const file = await File.findOne({
        _id: fileId,
        owner,
        type: "file",
        isDeleted: false,
    });

    return file;
};

// Get the file tree of a project
export const getTree = async (
    projectId: string,
    owner: string,
) => {
    const files = await File.find({
        projectId,
        owner,
        isDeleted: false,
    }).sort({
        createdAt: 1,
    });

    const tree = buildTree(files);

    return tree;
};