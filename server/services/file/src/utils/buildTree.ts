import type { IFile } from "../models/file.model.js";

export interface FileTreeNode {
    id: string;
    name: string;
    type: "file" | "folder";
    extension: string;
    language: string;
    content: string;
    size: number;
    starred?: boolean;
    children: FileTreeNode[];
}

export const buildTree = (files: IFile[]): FileTreeNode[] => {
    const nodeMap = new Map<string, FileTreeNode>();
    const tree: FileTreeNode[] = [];

    // Create a tree node for every file and folder
    for (const file of files) {
        const node: FileTreeNode = {
            id: file._id.toString(),
            name: file.name,
            type: file.type,
            extension: file.extension,
            language: file.language,
            content: file.content,
            size: file.size,
            children: [],
        };

        nodeMap.set(node.id, node);
    }

    // Connect each node to its parent
    for (const file of files) {
        const node = nodeMap.get(file._id.toString());

        if (!node) {
            continue;
        }

        if (!file.parentId) {
            tree.push(node);
            continue;
        }

        const parent = nodeMap.get(file.parentId.toString());

        if (parent) {
            parent.children.push(node);
        }
    }

    return tree;
};