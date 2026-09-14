import fs from "node:fs/promises";
import path from "node:path";

import { AppError } from "../error/AppError.js";
import { env } from "../config/env.js";
import type {
    FileTreeNode,
    FileTreeResponse,
} from "../types/terminal.js";
import {
    getWorkspace,
    safeName,
} from "./workspace.js";

const FILE_SERVICE_URL = env.FILE_SERVICE_URL;

// =================================================
// GET PROJECT TREE
// =================================================

export const getTree = async (
    projectId: string,
    userId: string,
): Promise<FileTreeNode[]> => {
    if (!projectId) {
        throw new AppError(
            "Project ID is required",
            400,
        );
    }

    if (!userId) {
        throw new AppError(
            "User ID is required",
            401,
        );
    }

    const url = `${FILE_SERVICE_URL}/tree/${projectId}`;

    let response: Response;

    try {
        response = await fetch(url, {
            headers: {
                "x-user-id": userId,
            },
        });
    } catch {
        throw new AppError(
            "Unable to connect to file service",
            503,
        );
    }

    const text = await response.text();

    let data: FileTreeResponse = {};

    try {
        data = text
            ? (JSON.parse(text) as FileTreeResponse)
            : {};
    } catch {
        data = {
            message: text,
        };
    }

    if (!response.ok) {
        throw new AppError(
            data.message ||
            `File service returned ${response.status}`,
            response.status,
        );
    }

    if (!Array.isArray(data.data)) {
        throw new AppError(
            "Invalid file tree response",
            500,
        );
    }

    return data.data;
};

// =================================================
// WRITE NODES TO DISK
// =================================================

export const writeNodes = async (
    nodes: FileTreeNode[],
    directory: string,
): Promise<void> => {
    if (!Array.isArray(nodes)) {
        return;
    }

    for (const node of nodes) {
        const name = safeName(node.name);

        const target = path.join(
            directory,
            name,
        );

        // ---------------------------------------------
        // FOLDER
        // ---------------------------------------------

        if (node.type === "folder") {
            await fs.mkdir(target, {
                recursive: true,
            });

            await writeNodes(
                node.children,
                target,
            );

            continue;
        }

        // ---------------------------------------------
        // FILE
        // ---------------------------------------------

        if (node.type === "file") {
            await fs.mkdir(
                path.dirname(target),
                {
                    recursive: true,
                },
            );

            await fs.writeFile(
                target,
                node.content ?? "",
                "utf8",
            );
        }
    }
};

// =================================================
// SYNC PROJECT
// =================================================

export const syncProject = async (
    projectId: string,
    userId: string,
): Promise<{
    tree: FileTreeNode[];
    root: string;
}> => {
    const tree = await getTree(
        projectId,
        userId,
    );

    const root = getWorkspace(
        projectId,
    );

    await fs.mkdir(root, {
        recursive: true,
    });

    // -----------------------------------------------
    // Skip artificial Mongo root folder
    // -----------------------------------------------

    if (
        tree.length === 1 &&
        tree[0]?.type === "folder"
    ) {
        await writeNodes(
            tree[0].children,
            root,
        );
    } else {
        await writeNodes(
            tree,
            root,
        );
    }

    console.log(
        "PROJECT SYNCED:",
        root,
    );

    return {
        tree,
        root,
    };
};