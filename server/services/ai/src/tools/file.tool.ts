import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { AppError } from "../error/AppError.js";
import {
    createFile,
    createFolder,
    createRootFolder,
    deleteItem,
    getFile,
    getTree,
    updateItem,
} from "../utils/fetchFileApi.js";

interface FileTreeItem {
    id: string;
    name: string;
    type: "file" | "folder";
    language: string;
    extension: string;
    children?: FileTreeItem[];
}

interface CompactTreeItem {
    id: string;
    name: string;
    type: "file" | "folder";
    language: string;
    extension: string;
    children: CompactTreeItem[];
}

interface FileToolContext {
    projectId: string;
    userId: string;
}

// =====================================================
// COMPACT TREE
// =====================================================

const compactTree = (
    items: FileTreeItem[] = [],
): CompactTreeItem[] => {
    return items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        language: item.language,
        extension: item.extension,
        children: compactTree(item.children ?? []),
    }));
};

// =====================================================
// FILE TOOLS
// =====================================================

export const fileTools = ({
    projectId,
    userId,
}: FileToolContext) => {
    // ===================================================
    // GET TREE
    // ===================================================

    const getTreeTool = tool(
        async () => {
            const result = await getTree({
                projectId,
                userId,
            });

            const tree = compactTree(result?.data ?? []);

            return JSON.stringify({
                success: true,
                tree,
            });
        },
        {
            name: "get_tree",

            description: `
Get the complete file and folder structure of the current project.

Use this when the project structure is unknown.

RULES:
1. Call this before creating or modifying files when IDs are unknown.
2. Use the exact IDs returned by this tool.
3. type="folder" means the item is a folder.
4. type="file" means the item is a file.
5. Folder IDs are used as parentId when creating nested items.
6. NEVER call get_file with a folder ID.
7. NEVER invent IDs.
8. Do not repeatedly call this tool.
9. Do not use terminal commands to inspect the project.
10. Do not call this tool again just to verify a successful operation.

Each tree item contains:
- id
- name
- type
- language
- extension
- children
`,

            schema: z.object({}),
        },
    );

    // ===================================================
    // GET FILE
    // ===================================================

    const getFileTool = tool(
        async ({ fileId }) => {
            const result = await getFile({
                fileId,
                userId,
            });

            const file = result?.data;

            if (!file) {
                return JSON.stringify({
                    success: false,
                    error: "File not found.",
                });
            }

            if (file.type !== "file") {
                return JSON.stringify({
                    success: false,
                    error: "The provided ID belongs to a folder, not a file.",
                    instruction:
                        "Do not call get_file for folders. Use the folder ID as parentId.",
                });
            }

            return JSON.stringify({
                success: true,
                file: {
                    id: file._id,
                    parentId: file.parentId,
                    name: file.name,
                    type: file.type,
                    language: file.language,
                    extension: file.extension,
                    content: file.content ?? "",
                },
            });
        },
        {
            name: "get_file",

            description: `
Read the complete content of an existing file.

RULES:
1. fileId must be an actual file ID.
2. NEVER pass a folder ID.
3. Use the exact file ID returned by get_tree.
4. Call this before update_file.
5. Do not call this for a newly created file unless necessary.
6. Do not repeatedly call this for the same file.
7. The returned content is the source of truth for the existing file.
`,

            schema: z.object({
                fileId: z.string(),
            }),
        },
    );

    // ===================================================
    // CREATE ROOT FOLDER
    // ===================================================

    const createRootFolderTool = tool(
        async ({ name }) => {
            const result = await createRootFolder({
                projectId,
                userId,
                name,
            });

            const folder = result?.data;

            if (!folder) {
                throw new AppError(
                    "Root folder was not created",
                    500,
                );
            }

            return JSON.stringify({
                success: true,
                operation: "root_folder_created",
                folder: {
                    id: folder._id,
                    name: folder.name,
                    type: folder.type,
                    parentId: folder.parentId,
                },
            });
        },
        {
            name: "create_root_folder",

            description: `
Create a folder directly under the project root.

Use this ONLY for root-level folders.

RULES:
1. This tool creates root folders only.
2. Do NOT use this for nested folders.
3. Create parent folders before nested folders.
4. Use create_folder for folders inside another folder.
5. Never invent a parentId.
6. Use the exact folder name requested by the user.
7. Never create duplicate folders.
8. Use the returned folder ID for nested items.
9. Do not call get_tree just to verify successful creation.

Example:
For "client/src":
1. create_root_folder({ name: "client" })
2. Take the returned client folder ID.
3. create_folder({
     parentId: <clientId>,
     name: "src"
   })
`,

            schema: z.object({
                name: z.string().min(1),
            }),
        },
    );

    // ===================================================
    // CREATE FOLDER
    // ===================================================

    const createFolderTool = tool(
        async ({ parentId, name }) => {
            const result = await createFolder({
                projectId,
                parentId,
                userId,
                name,
            });

            const folder = result?.data;

            if (!folder) {
                throw new AppError(
                    "Folder was not created",
                    500,
                );
            }

            return JSON.stringify({
                success: true,
                operation: "folder_created",
                folder: {
                    id: folder._id,
                    name: folder.name,
                    type: folder.type,
                    parentId: folder.parentId,
                },
            });
        },
        {
            name: "create_folder",

            description: `
Create a folder inside an existing folder.

RULES:
1. parentId must be an existing folder ID.
2. Use an exact ID returned by get_tree or a previous create operation.
3. Create parent folders before child folders.
4. Never invent IDs.
5. Never create duplicate folders.
6. Use the exact name requested by the user.
7. After successful creation, continue with the remaining requested work.
8. Do not call get_tree just to verify successful creation.
`,

            schema: z.object({
                parentId: z.string().min(1),
                name: z.string().min(1),
            }),
        },
    );

    // ===================================================
    // CREATE FILE
    // ===================================================

    const createFileTool = tool(
        async ({
            parentId,
            name,
            language,
            content,
        }) => {
            const extension = name.includes(".")
                ? name.split(".").pop() ?? ""
                : "";

            const size = Buffer.byteLength(
                content,
                "utf8",
            );

            const result = await createFile({
                projectId,
                parentId: parentId ?? null,
                userId,
                name,
                extension,
                language: language ?? "plaintext",
                content,
                size,
            });

            const file = result?.data;

            if (!file) {
                throw new AppError(
                    "File was not created",
                    500,
                );
            }

            return JSON.stringify({
                success: true,
                operation: "file_created",
                file: {
                    id: file._id,
                    parentId: file.parentId,
                    name: file.name,
                    type: file.type,
                    language: file.language,
                    extension: file.extension,
                },
            });
        },
        {
            name: "create_file",

            description: `
Create a new file.

RULES:
1. Use get_tree first when the project structure is unknown.
2. Use the exact folder ID as parentId for nested files.
3. Use null or omit parentId for a root-level file.
4. Never invent IDs.
5. Never create duplicate files.
6. Send the COMPLETE file content.
7. Create required folders before creating files inside them.
8. Never use terminal commands to create files.
9. Do not call get_file immediately after creating a file.
10. Continue until every requested file has been created.
11. Do not stop after creating only one file when more files are requested.
12. For React/Vite projects, create all files required by the user's request.

The language should match the file:
- .ts/.tsx → typescript
- .js/.jsx → javascript
- .json → json
- .css → css
- .html → html
- .py → python
- .md → markdown
`,

            schema: z.object({
                parentId: z.string().optional(),
                name: z.string().min(1),
                language: z.string().optional(),
                content: z.string(),
            }),
        },
    );

    // ===================================================
    // UPDATE FILE
    // ===================================================

    const updateFileTool = tool(
        async ({
            fileId,
            content,
        }) => {
            const result = await updateItem({
                itemId: fileId,
                userId,
                content,
            });

            const file = result?.data;

            if (!file) {
                throw new AppError(
                    "File was not updated",
                    500,
                );
            }

            return JSON.stringify({
                success: true,
                operation: "file_updated",
                file: {
                    id: file._id,
                    parentId: file.parentId,
                    name: file.name,
                    type: file.type,
                    language: file.language,
                    extension: file.extension,
                },
            });
        },
        {
            name: "update_file",

            description: `
Update an existing file.

RULES:
1. Call get_file before updating.
2. fileId must be an actual file ID.
3. NEVER use a folder ID.
4. Use the exact file ID returned by get_tree or get_file.
5. Send the COMPLETE updated file content.
6. Do not update files that do not exist.
7. Do not invent IDs.
8. After a successful update, continue with the remaining requested work.
9. Do not call get_file again unless another modification is required.
`,

            schema: z.object({
                fileId: z.string().min(1),
                content: z.string(),
            }),
        },
    );

    // ===================================================
    // DELETE ITEM
    // ===================================================

    const deleteItemTool = tool(
        async ({ itemId }) => {
            const result = await deleteItem({
                itemId,
                userId,
            });

            const item = result?.data;

            if (!item) {
                throw new AppError(
                    "Item was not deleted",
                    500,
                );
            }

            return JSON.stringify({
                success: true,
                operation: "item_deleted",
                item: {
                    id: item._id,
                    parentId: item.parentId,
                    name: item.name,
                    type: item.type,
                },
            });
        },
        {
            name: "delete_item",

            description: `
Delete an existing file or folder.

RULES:
1. Use the exact ID returned by get_tree.
2. Only delete an item when the user explicitly requests it.
3. NEVER invent an item ID.
4. Do not delete unrelated files or folders.
5. After successful deletion, continue with the remaining requested work.
6. Do not call get_tree just to verify successful deletion.
`,

            schema: z.object({
                itemId: z.string().min(1),
            }),
        },
    );

    // ===================================================
    // FINISH TASK
    // ===================================================

    const finishTaskTool = tool(
        async ({ summary }) => {
            return JSON.stringify({
                success: true,
                operation: "task_completed",
                summary,
            });
        },
        {
            name: "finish_task",

            description: `
Signal that the user's request has been completely completed.

ONLY call this when ALL requested work is finished.

Before calling finish_task, verify mentally that:
1. Every requested folder has been created.
2. Every requested file has been created or updated.
3. Every requested deletion has been completed.
4. All requested code changes are complete.
5. No requested work remains.

This must be the FINAL tool call.

Do NOT call finish_task after completing only part of the task.
`,

            schema: z.object({
                summary: z.string().min(1),
            }),
        },
    );

    // ===================================================
    // RETURN TOOLS
    // ===================================================

    return [
        getTreeTool,
        getFileTool,
        createRootFolderTool,
        createFolderTool,
        createFileTool,
        updateFileTool,
        deleteItemTool,
        finishTaskTool,
    ];
};