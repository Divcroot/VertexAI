import { tool } from "@langchain/core/tools";
import { z } from "zod";

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
    parentId: string | null;
    name: string;
    type: "file" | "folder";
    language: string;
    extension: string;
    children?: FileTreeItem[];
}

interface CompactTreeItem {
    id: string;
    parentId: string | null;
    name: string;
    type: "file" | "folder";
    language: string;
    extension: string;
    children: CompactTreeItem[];
}

// =====================================================
// COMPACT TREE
// =====================================================

const compactTree = (
    items: FileTreeItem[] = [],
): CompactTreeItem[] => {
    return items.map((item) => ({
        id: item.id,
        parentId: item.parentId,
        name: item.name,
        type: item.type,
        language: item.language,
        extension: item.extension,
        children: compactTree(item.children || []),
    }));
};

// =====================================================
// CREATE FILE TOOLS
// =====================================================

export const fileTools = ({
    projectId,
    userId,
}: {
    projectId: string;
    userId: string;
}) => {
    // ===================================================
    // GET TREE
    // ===================================================

    const getTreeTool = tool(
        async () => {
            console.log("AI TOOL -> get_tree");

            const result = await getTree({
                projectId,
                userId,
            });

            const tree = compactTree(result?.tree || []);

            console.log(
                "AI TREE LOADED:",
                tree.length,
            );

            return JSON.stringify({
                success: true,
                tree,
            });
        },
        {
            name: "get_tree",

            description: `
Get the complete project file and folder tree.

IMPORTANT:

1. Use this when the project structure is unknown.
2. Do not repeatedly call get_tree.
3. type="folder" means folder.
4. type="file" means file.
5. Folder IDs are used as parentId.
6. NEVER call get_file with a folder ID.
7. Do not use terminal commands to inspect the project.
8. Use the exact IDs returned by this tool.

The tree contains:
id
parentId
name
type
language
extension
children
`,

            schema: z.object({}),
        },
    );

    // ===================================================
    // GET FILE
    // ===================================================

    const getFileTool = tool(
        async ({ fileId }) => {
            console.log(
                "AI TOOL -> get_file:",
                fileId,
            );

            const result = await getFile({
                fileId,
                userId,
            });

            if (
                result?.file &&
                result.file.type !== "file"
            ) {
                console.log(
                    "GET FILE BLOCKED - ID IS FOLDER:",
                    fileId,
                );

                return JSON.stringify({
                    success: false,
                    error:
                        "The provided ID belongs to a folder, not a file.",
                    instruction:
                        "Do not call get_file for folders. Use the folder ID as parentId.",
                });
            }

            if (!result?.file) {
                return JSON.stringify({
                    success: false,
                    error: "File not found.",
                });
            }

            return JSON.stringify({
                success: true,
                file: {
                    _id: result.file._id,
                    parentId: result.file.parentId,
                    name: result.file.name,
                    type: result.file.type,
                    language: result.file.language,
                    extension: result.file.extension,
                    content: result.file.content || "",
                },
            });
        },
        {
            name: "get_file",

            description: `
Read an EXISTING FILE before modifying it.

STRICT RULES:

1. fileId must belong to a file.
2. NEVER pass a folder ID.
3. Use exact file ID from get_tree.
4. Call this before update_file.
5. Do not call this for newly created files unless necessary.
6. Do not call this repeatedly for the same file.

The response contains the complete file content.
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
            console.log(
                "AI TOOL -> create_root_folder:",
                name,
            );

            const result = await createRootFolder({
                projectId,
                userId,
                name,
            });

            const folder = result?.data;

            console.log(
                "ROOT FOLDER CREATED:",
                folder?._id,
                folder?.name,
            );

            return JSON.stringify({
                success: true,
                operation: "root_folder_created",
                folder: result.data,
            });
        },
        {
            name: "create_root_folder",

            description: `
Create a folder DIRECTLY under the project root.

IMPORTANT:
- This tool is ONLY for folders that belong directly to the project root.
- Do NOT use this tool for a folder that should be inside another folder.
- If the user requests a structure such as "client/src", create "client" first with this tool.
- Then create "src" using create_folder with clientId as parentId.
- NEVER use this tool to create nested folders.
- NEVER invent a parent folder.
- Use exact names requested by the user.
- Do not create duplicate folders.
- After successful creation, use the returned folder ID when creating nested items.
- Do not call get_tree just to verify a successful creation.

Example:

User:
"Create client/src"

Correct:
1. create_root_folder({ name: "client" })
2. Take the returned client folder ID.
3. create_folder({
     parentId: <clientId>,
     name: "src"
   })

Incorrect:
create_root_folder({ name: "src" })
`,

            schema: z.object({
                name: z.string(),
            }),
        },
    );

    // ===================================================
    // CREATE FOLDER
    // ===================================================

    const createFolderTool = tool(
        async ({
            parentId,
            name,
        }) => {
            console.log(
                "AI TOOL -> create_folder:",
                name,
            );

            const result = await createFolder({
                projectId,
                parentId,
                userId,
                name,
            });

            const folder = result?.data;

            console.log(
                "FOLDER CREATED:",
                folder?._id,
                folder?.name,
            );

            return JSON.stringify({
                success: true,
                operation: "folder_created",
                folder: folder,
            });
        },
        {
            name: "create_folder",

            description: `
Create a new folder.

RULES:

1. Create parent folders first.
2. Use exact parentId from get_tree.
3. Never create duplicate folders.
4. A folder directly inside another folder must use that
   folder's ID as parentId.
5. After creation continue with the remaining files.
6. Do not call get_tree again just to verify the folder.
`,

            schema: z.object({
                parentId: z.string(),
                name: z.string(),
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
            console.log(
                "AI TOOL -> create_file:",
                name,
            );

            const extension = name.includes(".")
                ? name.split(".").pop() || ""
                : "";

            const size = Buffer.byteLength(
                content,
                "utf8",
            );

            const result = await createFile({
                projectId,
                parentId,
                userId,
                name,
                extension,
                language: language || "plaintext",
                content,
                size,
            });

            const file = result?.data;

            console.log(
                "FILE CREATED:",
                file?._id,
                file?.name,
            );

            return JSON.stringify({
                success: true,
                operation: "file_created",
                file,
            });
        },
        {
            name: "create_file",

            description: `
Create a NEW FILE.

RULES:

1. Use get_tree first when project structure is unknown.
2. Use exact folder ID as parentId.
3. Never create duplicate files.
4. Send complete file content.
5. Create folders before files inside them.
6. Never use terminal commands to create files.
7. Do not call get_file immediately after creating a file.
8. Continue creating all required files.
9. Do not stop after creating only one file.

For a React/Vite project, create ALL required files.
`,

            schema: z.object({
                parentId: z.string().nullable(),
                name: z.string(),
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
            console.log(
                "AI TOOL -> update_file:",
                fileId,
            );

            const result = await updateItem({
                itemId: fileId,
                userId,
                content,
            });

            const file = result?.data;

            console.log(
                "FILE UPDATED:",
                file?._id,
                file?.name,
            );

            return JSON.stringify({
                success: true,
                operation: "file_updated",
                file,
            });
        },
        {
            name: "update_file",

            description: `
Update an EXISTING FILE.

RULES:

1. Call get_file before updating.
2. fileId must be an actual file ID.
3. NEVER use a folder ID.
4. Send the complete updated file content.
5. Do not update files that do not exist.
6. After successful update continue with remaining work.
7. Do not call get_file again unless another modification is needed.
`,

            schema: z.object({
                fileId: z.string(),
                content: z.string(),
            }),
        },
    );

    // ===================================================
    // DELETE ITEM
    // ===================================================

    const deleteItemTool = tool(
        async ({ itemId }) => {
            console.log(
                "AI TOOL -> delete_item:",
                itemId,
            );

            const result = await deleteItem({
                itemId,
                userId,
            });

            const item = result?.data;

            console.log(
                "ITEM DELETED:",
                item?._id,
                item?.name,
            );

            return JSON.stringify({
                success: true,
                operation: "item_deleted",
                item: {
                    _id: item?._id,
                    parentId: item?.parentId,
                    name: item?.name,
                    type: item?.type,
                },
            });
        },
        {
            name: "delete_item",

            description: `
Delete an existing file or folder.

RULES:

1. Use the exact ID returned by get_tree.
2. Do not delete an item unless the user requested it.
3. NEVER invent an item ID.
4. After successful deletion continue with the remaining work.
`,

            schema: z.object({
                itemId: z.string(),
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
    ];
};