import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { motion, AnimatePresence } from "motion/react";

import { createPortal } from "react-dom";

import toast from "react-hot-toast";

import { ChevronRight, FilePlus2, FolderIcon, FolderOpen, FolderPlus, Pencil, Trash2 } from "lucide-react";

import { useFile, type FileNode } from "../context/FileContext";

import FileItem from "./FileItem";

import { getFolderColor } from "../utils/fileIcons";
import { getLanguageFromExtension } from "../utils/language";

interface FolderProps {
    projectId: string;
    node: FileNode;
    openFile: (file: FileNode) => void;
}

interface MenuPosition {
    x: number;
    y: number;
}

type CreatingType = "file" | "folder" | null;

const Folder = ({ projectId, node, openFile }: FolderProps) => {

    const [open, setOpen] = useState<boolean>(false);
    const [renaming, setRenaming] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [creatingLoading, setCreatingLoading] = useState<boolean>(false);

    const [folderName, setFolderName] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [name, setName] = useState<string>(node.name);

    const [creating, setCreating] = useState<CreatingType>(null);

    const [menu, setMenu] = useState<MenuPosition | null>(null);

    const createInputRef = useRef<HTMLInputElement>(null);

    const { createFolder, createFile, updateItem, deleteItem } = useFile();

    const folderColor = getFolderColor(node.name);

    // CREATE FOLDER

    const handleCreateFolder = async (): Promise<void> => {
        const name = folderName.trim();

        if (!name || creatingLoading) {
            return;
        }

        setCreatingLoading(true);

        try {
            const createdFolder = await createFolder({
                projectId,
                parentId: node.id,
                name,
            });

            if (createdFolder) {
                setFolderName("");
                setCreating(null);
                setOpen(true);
            }
        } catch (error: unknown) {
            console.log("Create folder error:", error);

            const message = error instanceof Error ? error.message : "Failed to create folder.";

            toast.error(message);

        } finally {
            setCreatingLoading(false);
        }
    };

    // CREATE FILE

    const handleCreateFile = async (): Promise<void> => {
        const name = fileName.trim();

        if (!name || creatingLoading) {
            return;
        }

        const extension = name.includes(".")
            ? name.split(".").pop() || ""
            : "";

        const language = getLanguageFromExtension(extension);

        setCreatingLoading(true);

        try {
            const createdFile = await createFile({
                projectId,
                parentId: node.id,
                name,
                extension,
                language,
                content: "",
                size: 0,
            });

            if (createdFile) {
                setFileName("");
                setCreating(null);
                setOpen(true);
            }
        } catch (error: unknown) {
            console.log("Create file error:", error);

            const message = error instanceof Error ? error.message : "Failed to create file.";

            toast.error(message);

        } finally {
            setCreatingLoading(false);
        }
    };

    // RENAME ITEM

    const handleRename = async (): Promise<void> => {
        const newName = name.trim();

        if (!newName || newName === node.name || loading) {
            setRenaming(false);
            setName(node.name);
            return;
        }

        setLoading(true);

        try {
            const updatedItem = await updateItem(node.id, {
                name: newName,
            });

            if (updatedItem) {
                setRenaming(false);
            } else {
                setName(node.name);
                setRenaming(false);
            }
        } catch (error: unknown) {
            console.log("Rename folder error:", error);

            const message = error instanceof Error ? error.message : "Failed to rename folder.";

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    // DELETE ITEM

    const handleDelete = async (): Promise<void> => {
        if (loading) {
            return;
        }

        setLoading(true);

        try {
            await deleteItem(node.id);
        } catch (error: unknown) {
            console.log("Delete folder error:", error);

            const message = error instanceof Error ? error.message : "Failed to delete item.";

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    // START CREATING

    const handleNewFolder = (): void => {
        setCreating("folder");
        setFileName("");
        setFolderName("");
        setOpen(true);
    };

    const handleNewFile = (): void => {
        setCreating("file");
        setFolderName("");
        setFileName("");
        setOpen(true);
    };

    // CANCEL CREATION

    const cancelCreation = (): void => {
        if (creatingLoading) {
            return;
        }

        setCreating(null);
        setFolderName("");
        setFileName("");
    };

    // KEYBOARD HANDLING

    const handleFolderKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (e.key === "Enter") {
            void handleCreateFolder();
        }

        if (e.key === "Escape") {
            cancelCreation();
        }
    };

    const handleFileKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (e.key === "Enter") {
            void handleCreateFile();
        }

        if (e.key === "Escape") {
            cancelCreation();
        }
    };

    // CONTEXT MENU

    const handleContextMenu = (
        e: React.MouseEvent<HTMLDivElement>,
    ): void => {
        e.preventDefault();
        e.stopPropagation();

        setMenu({
            x: e.clientX,
            y: e.clientY,
        });
    };

    useEffect(() => {
        if (!creating) {
            return;
        }

        const handleClickOutside = (event: MouseEvent): void => {
            const target = event.target as Node;

            if (
                createInputRef.current &&
                !createInputRef.current.contains(target)
            ) {
                if (!creatingLoading) {
                    cancelCreation();
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );
        };
    }, [creating, creatingLoading]);

    // RENDER

    return (
        <div className="relative">

            {/* FOLDER ROW */}

            <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                onContextMenu={handleContextMenu}
                className="group flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >

                {/* FOLDER CONTENT */}

                <div className="flex min-w-0 flex-1 items-center gap-1.5">

                    {!renaming && (

                        <button
                            type="button"
                            onClick={() => setOpen((value) => !value)}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left"
                        >

                            <motion.div
                                animate={{ rotate: open ? 90 : 0 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="shrink-0"
                            >

                                <ChevronRight
                                    size={14}
                                    className="text-zinc-500"
                                />

                            </motion.div>

                            {open ? (

                                <FolderOpen
                                    size={16}
                                    className={`shrink-0 ${folderColor}`}
                                />

                            ) : (

                                <FolderIcon
                                    size={16}
                                    className={`shrink-0 ${folderColor} opacity-80`}
                                />

                            )}

                            <span className="truncate text-[13px] text-zinc-400 transition-colors group-hover:text-white">
                                {node.name}
                            </span>

                        </button>

                    )}

                    {renaming && (

                        <>

                            <motion.div
                                animate={{ rotate: open ? 90 : 0 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="shrink-0"
                            >

                                <ChevronRight
                                    size={14}
                                    className="text-zinc-500"
                                />

                            </motion.div>

                            {open ? (

                                <FolderOpen
                                    size={16}
                                    className={`shrink-0 ${folderColor}`}
                                />

                            ) : (

                                <FolderIcon
                                    size={16}
                                    className={`shrink-0 ${folderColor} opacity-80`}
                                />

                            )}

                            <input
                                autoFocus
                                type="text"
                                value={name}
                                disabled={loading}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        void handleRename();
                                    }

                                    if (e.key === "Escape") {
                                        e.preventDefault();
                                        setRenaming(false);
                                        setName(node.name);
                                    }
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className="min-w-0 flex-1 rounded border border-sky-400/40 bg-white/5 px-1.5 py-0.5 text-[13px] text-white outline-none focus:ring-2 focus:ring-sky-400/10 disabled:opacity-50"
                            />

                        </>

                    )}

                </div>

                {/* QUICK ACTIONS */}

                <div className="hidden items-center gap-0.5 group-hover:flex">

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNewFile();
                        }}
                        className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                        title="New file"
                    >

                        <FilePlus2 size={13} />

                    </motion.button>

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNewFolder();
                        }}
                        className="rounded-md p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                        title="New folder"
                    >

                        <FolderPlus size={13} />

                    </motion.button>

                </div>

            </motion.div>

            {/* CONTEXT MENU */}

            {menu &&

                createPortal(

                    <>

                        {/* BACKDROP */}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenu(null)}
                            className="fixed inset-0 z-40"
                        />

                        {/* MENU */}

                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -6 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -6 }}
                            transition={{ duration: 0.14, ease: "easeOut" }}
                            style={{ left: menu.x, top: menu.y }}
                            className="fixed z-50 w-52 rounded-xl border border-white/8 bg-[#17171a]/95 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
                        >

                            {/* NEW FILE */}

                            <button
                                type="button"
                                onClick={() => {
                                    setMenu(null);
                                    handleNewFile();
                                }}
                                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                            >

                                <FilePlus2 size={13} />
                                New File

                            </button>

                            {/* NEW FOLDER */}

                            <button
                                type="button"
                                onClick={() => {
                                    setMenu(null);
                                    handleNewFolder();
                                }}
                                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white"
                            >

                                <FolderPlus size={13} />
                                New Folder

                            </button>

                            <div className="my-1 h-px bg-white/8" />

                            {/* RENAME */}

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                    setMenu(null);
                                    setName(node.name);
                                    setRenaming(true);
                                }}
                                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/8 hover:text-white"
                            >

                                <Pencil size={13} />
                                Rename

                            </button>

                            {/* DELETE */}

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                    setMenu(null);
                                    void handleDelete();
                                }}
                                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
                            >

                                <Trash2 size={13} />
                                Delete

                            </button>

                        </motion.div>

                    </>,
                    document.body,

                )}

            {/* CHILDREN */}

            <AnimatePresence initial={false}>

                {open && (

                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="ml-5 overflow-hidden border-l border-white/5 pl-1"
                    >

                        {/* EXISTING CHILDREN */}

                        {node.children.map((child) => {

                            if (child.type === "folder") {

                                return (
                                    <Folder
                                        key={child.id}
                                        projectId={projectId}
                                        node={child}
                                        openFile={openFile}
                                    />
                                );

                            }

                            return (
                                <FileItem
                                    key={child.id}
                                    node={child}
                                    openFile={openFile}
                                />
                            )

                        })}

                        {/* NEW FOLDER INPUT */}

                        {creating === "folder" && (

                            <div className="py-1 pl-1">

                                <motion.input
                                    ref={createInputRef}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    autoFocus
                                    type="text"
                                    value={folderName}
                                    placeholder="Folder name"
                                    disabled={creatingLoading}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setFolderName(e.target.value)
                                    }
                                    onKeyDown={handleFolderKeyDown}
                                    className="w-full rounded-md border border-white/10 bg-white/4 px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15 disabled:opacity-50"
                                />

                            </div>

                        )}

                        {/* NEW FILE INPUT */}

                        {creating === "file" && (

                            <div className="py-1 pl-1">

                                <motion.input
                                    ref={createInputRef}
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    autoFocus
                                    type="text"
                                    value={fileName}
                                    placeholder="File name"
                                    disabled={creatingLoading}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setFileName(e.target.value)
                                    }
                                    onKeyDown={handleFileKeyDown}
                                    className="w-full rounded-md border border-white/10 bg-white/4 px-2.5 py-1.5 text-[13px] text-white placeholder-zinc-500 outline-none transition-all focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/15 disabled:opacity-50"
                                />

                            </div>

                        )}

                    </motion.div>

                )}

            </AnimatePresence>

        </div>
    );
};

export default Folder;