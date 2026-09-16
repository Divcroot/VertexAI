import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import api from "../utils/api";
import { useProjects } from "./ProjectContext";

export interface FileNode {
    id: string;
    name: string;
    type: "file" | "folder";
    extension: string;
    language: string;
    content: string;
    size: number;
    children: FileNode[];
}

export interface FileItem {
    _id: string;
    owner: string;
    parentId: string | null;
    projectId: string;
    name: string;
    type: "file" | "folder";
    extension: string;
    language: string;
    content: string;
    size: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

interface FileTreeResponse {
    success: boolean;
    data?: FileNode[];
    message?: string;
}

interface FileResponse {
    success: boolean;
    data?: FileItem;
    message?: string;
}

interface GenericResponse {
    success: boolean;
    message?: string;
    data?: FileItem;
}

interface CreateRootFolderInput {
    projectId: string;
    name: string;
}

interface CreateFolderInput {
    projectId: string | undefined;
    parentId: string;
    name: string;
}

interface CreateFileInput {
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

interface FileContextValue {
    tree: FileNode[];
    currentFile: FileItem | null;
    loading: boolean;

    setTree: React.Dispatch<React.SetStateAction<FileNode[]>>;
    setCurrentFile: React.Dispatch<React.SetStateAction<FileItem | null>>;

    refreshTree: () => Promise<void>;
    getFile: (fileId: string) => Promise<FileItem | null>;

    createRootFolder: (
        folder: CreateRootFolderInput,
    ) => Promise<FileItem | null>;

    createFolder: (
        folder: CreateFolderInput,
    ) => Promise<FileItem | null>;

    createFile: (
        file: CreateFileInput,
    ) => Promise<FileItem | null>;

    updateItem: (
        fileId: string,
        data: UpdateItemInput,
    ) => Promise<FileItem | null>;

    deleteItem: (fileId: string) => Promise<boolean>;
}

interface FileProviderProps {
    children: ReactNode;
}

const FileContext = createContext<FileContextValue | undefined>(undefined);

export const FileProvider = ({ children }: FileProviderProps) => {
    const { currentProject } = useProjects();

    const [tree, setTree] = useState<FileNode[]>([]);
    const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch project file tree
    const refreshTree = useCallback(async (): Promise<void> => {
        if (!currentProject) {
            setTree([]);
            return;
        }

        try {
            const { data } = await api.get<FileTreeResponse>(
                `/api/files/tree/${currentProject._id}`,
            );

            if (data.success && data.data) {
                setTree(data.data);
            } else {
                setTree([]);
            }
        } catch (error: unknown) {
            console.log("File tree fetch error:", error);
            setTree([]);
        }
    }, [currentProject?._id]);

    // Get a single file
    const getFile = async (
        fileId: string,
    ): Promise<FileItem | null> => {
        try {
            const { data } = await api.get<FileResponse>(
                `/api/files/${fileId}`,
            );

            if (data.success && data.data) {
                setCurrentFile(data.data);
                return data.data;
            }

            return null;
        } catch (error: unknown) {
            console.log("Get file error:", error);
            return null;
        }
    };

    // Create root folder
    const createRootFolder = async (
        folder: CreateRootFolderInput,
    ): Promise<FileItem | null> => {
        try {
            const { data } = await api.post<GenericResponse>(
                "/api/files/create-root-folder",
                folder,
            );

            if (data.success && data.data) {
                await refreshTree();
                return data.data;
            }

            return null;
        } catch (error: unknown) {
            console.log("Create root folder error:", error);
            return null;
        }
    };

    // Create folder inside another folder
    const createFolder = async (
        folder: CreateFolderInput,
    ): Promise<FileItem | null> => {
        try {
            const { data } = await api.post<GenericResponse>(
                "/api/files/create-folder",
                folder,
            );

            if (data.success && data.data) {
                await refreshTree();
                return data.data;
            }

            return null;
        } catch (error: unknown) {
            console.log("Create folder error:", error);
            return null;
        }
    };

    // Create file
    const createFile = async (
        file: CreateFileInput,
    ): Promise<FileItem | null> => {
        try {
            const { data } = await api.post<GenericResponse>(
                "/api/files/create-file",
                file,
            );

            if (data.success && data.data) {
                await refreshTree();
                return data.data;
            }

            return null;
        } catch (error: unknown) {
            console.log("Create file error:", error);
            return null;
        }
    };

    // Update Item
    const updateItem = async (
        itemId: string,
        data: UpdateItemInput
    ): Promise<FileItem | null> => {
        try {
            const { data: response } = await api.post<GenericResponse>(
                `/api/files/update/${itemId}`,
                data,
            );

            if (response.success && response.data) {
                await refreshTree();
                return response.data;
            }

            return null;
        } catch (error: unknown) {
            console.log("Update item error:", error);
            return null;
        }
    };

    const deleteItem = async (
        itemId: string,
    ): Promise<boolean> => {
        try {
            const { data: response } = await api.delete<GenericResponse>(
                `/api/files/${itemId}`,
            );

            if (!response.success) {
                return false;
            }

            await refreshTree();
            return true;
        } catch (error: unknown) {
            console.log("Delete item error:", error);
            return false;
        }
    };

    // Load tree whenever current project changes
    useEffect(() => {
        if (!currentProject) {
            setTree([]);
            setCurrentFile(null);
            setLoading(false);
            return;
        }

        const loadFiles = async (): Promise<void> => {
            setLoading(true);

            try {
                await refreshTree();
            } finally {
                setLoading(false);
            }
        };

        void loadFiles();
    }, [currentProject?._id]);

    return (
        <FileContext.Provider
            value={{
                tree,
                currentFile,
                loading,

                setTree,
                setCurrentFile,

                refreshTree,
                getFile,

                createRootFolder,
                createFolder,
                createFile,

                updateItem,
                deleteItem,
            }}
        >
            {children}
        </FileContext.Provider>
    );
};

export const useFile = (): FileContextValue => {
    const context = useContext(FileContext);

    if (!context) {
        throw new Error(
            "useFile must be used inside a FileProvider",
        );
    }

    return context;
};