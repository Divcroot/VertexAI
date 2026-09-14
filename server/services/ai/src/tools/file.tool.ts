import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
    createFile,
    createFolder,
    getFile,
    getProjectTree,
    updateFile,
} from "../config/fileService.js";

interface FileTreeItem {
    _id: string;
    parentId: string | null;
    name: string;
    type: "file" | "folder";
    language?: string;
    extension?: string;
    children?: FileTreeItem[];
}

interface FileData {
    _id: string;
    parentId: string | null;
    name: string;
    type: "file" | "folder";
    language?: string;
    extension?: string;
    content?: string;
}

interface FileServiceResult {
    success?: boolean;
    message?: string;
    data?: unknown;
    tree?: FileTreeItem[];
    file?: FileData;
    [key: string]: unknown;
}

interface CompactTreeNode {
    _id: string;
    parentId: string | null;
    name: string;
    type: "file" | "folder";
    language?: string;
    extension?: string;
    children: CompactTreeNode[];
}

const compactTree = (
    items: FileTreeItem[] = [],
): CompactTreeNode[] => {
    return items.map((item) => ({
        _id: item._id,
        parentId: item.parentId,
        name: item.name,
        type: item.type,
        language: item.language,
        extension: item.extension,
        children: compactTree(item.children || []),
    }));
};

export const createFileTools = ({
    projectId,
    userId,
}: {
    projectId: string;
    userId: string;
}) => {
    // Get the complete project file tree
    const getTreeTool = tool(
        async () => {
            const result =
                (await getProjectTree(
                    projectId,
                    userId,
                )) as FileServiceResult;

            const tree =
                (result.tree ||
                    (result.data as FileTreeItem[] | undefined) ||
                    []);

            return JSON.stringify({
                success: true,
                tree: compactTree(tree),
            });
        },
        {
            name: "get_tree",
            description: `
Get the complete file and folder structure of the current project.

Use this when you do not know the project's current structure.
Do not call this repeatedly if you already know the structure.
Use the exact IDs returned by this tool for later operations.

Rules:
- Do not call get_file on folders.
- Do not use this tool for terminal operations.
`,
        },
    );

    // Get a single file and its content
    const getFileTool = tool(
        async ({ fileId }) => {
            const result =
                (await getFile(
                    fileId,
                    userId,
                )) as FileServiceResult;

            const file =
                result.file ||
                (result.data as FileData | undefined);

            if (!file) {
                return JSON.stringify({
                    success: false,
                    error: "File not found.",
                });
            }

            if (file.type !== "file") {
                return JSON.stringify({
                    success: false,
                    error: "The requested item is not a file.",
                });
            }

            return JSON.stringify({
                success: true,
                file: {
                    _id: file._id,
                    parentId: file.parentId,
                    name: file.name,
                    type: file.type,
                    language: file.language,
                    extension: file.extension,
                    content: file.content,
                },
            });
        },
        {
            name: "get_file",
            description: `
Get the content and metadata of a specific file.

Rules:
- Call this before updating an existing file.
- Use the exact file ID.
- Do not call this on folders.
- Do not call repeatedly for the same file when you already have its content.
- Do not use this for newly created files.
`,
            schema: z.object({
                fileId: z.string(),
            }),
        },
    );

    // Create a folder
    const createFolderTool = tool(
        async ({ parentId, name }) => {
            const result =
                (await createFolder(
                    {
                        projectId,
                        parentId,
                        name,
                    },
                    userId,
                )) as FileServiceResult;

            const folder =
                result.data as FileData | undefined;

            return JSON.stringify({
                success: true,
                operation: "folder_created",
                folder: folder
                    ? {
                        _id: folder._id,
                        parentId: folder.parentId,
                        name: folder.name,
                        type: folder.type,
                    }
                    : result.data,
            });
        },
        {
            name: "create_folder",
            description: `
Create a folder in the project.

Rules:
- Create parent folders before child folders.
- Use the exact parent folder ID.
- Use null as parentId for a root folder.
- Do not create duplicate folders.
- Do not call get_tree just to verify the creation.
`,
            schema: z.object({
                parentId: z.string().nullable(),
                name: z.string(),
            }),
        },
    );

    // Create a file
    const createFileTool = tool(
        async ({
            parentId,
            name,
            language,
            content,
        }) => {
            const result =
                (await createFile(
                    {
                        projectId,
                        parentId,
                        name,
                        language: language || "plaintext",
                        content,
                    },
                    userId,
                )) as FileServiceResult;

            const file =
                result.data as FileData | undefined;

            return JSON.stringify({
                success: true,
                operation: "file_created",
                file: file
                    ? {
                        _id: file._id,
                        parentId: file.parentId,
                        name: file.name,
                        type: file.type,
                        language: file.language,
                        extension: file.extension,
                    }
                    : result.data,
            });
        },
        {
            name: "create_file",
            description: `
Create a new file in the project.

Rules:
- Get the project tree first when the structure is unknown.
- Use the exact parent folder ID.
- Do not create duplicate files.
- Provide the complete file content.
- Create required folders before creating files.
- Do not call get_file after creating a file.
- Do not use this tool for terminal operations.
- Continue creating all files required to complete the task.
`,
            schema: z.object({
                parentId: z.string(),
                name: z.string(),
                language: z.string().optional(),
                content: z.string(),
            }),
        },
    );

    // Update an existing file
    const updateFileTool = tool(
        async ({ fileId, content }) => {
            const result =
                (await updateFile(
                    fileId,
                    { content },
                    userId,
                )) as FileServiceResult;

            const file =
                result.data as FileData | undefined;

            return JSON.stringify({
                success: true,
                operation: "file_updated",
                file: file
                    ? {
                        _id: file._id,
                        parentId: file.parentId,
                        name: file.name,
                        type: file.type,
                        language: file.language,
                        extension: file.extension,
                    }
                    : result.data,
            });
        },
        {
            name: "update_file",
            description: `
Update an existing file.

Rules:
- Call get_file before updating an existing file.
- Use the exact file ID.
- Provide the complete updated file content.
- Do not update folders.
- Do not repeatedly update the same file unnecessarily.
- Continue until the requested task is complete.
`,
            schema: z.object({
                fileId: z.string(),
                content: z.string(),
            }),
        },
    );

    return [
        getTreeTool,
        getFileTool,
        createFolderTool,
        createFileTool,
        updateFileTool,
    ];
};