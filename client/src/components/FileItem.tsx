import { Pencil, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from "react";

import { getFileIcon } from "../utils/fileIcons";
import { useFile, type FileNode } from "../context/FileContext";

interface FileItemProps {
    node: FileNode;
    openFile: (file: FileNode) => void;
}

interface MenuPosition {
    x: number;
    y: number;
}

const FileItem = ({ node, openFile }: FileItemProps) => {
    const [menu, setMenu] = useState<MenuPosition | null>(null);
    const [renaming, setRenaming] = useState<boolean>(false);
    const [name, setName] = useState<string>(node.name);
    const [loading, setLoading] = useState<boolean>(false);

    const { updateItem, deleteItem } = useFile();

    const { icon: FileIcon, color } = getFileIcon(node.name);

    // =================================================
    // CONTEXT MENU
    // =================================================

    const handleContextMenu = (
        e: MouseEvent<HTMLDivElement>,
    ): void => {
        e.preventDefault();
        e.stopPropagation();

        setMenu({
            x: e.clientX,
            y: e.clientY,
        });
    };

    // =================================================
    // RENAME
    // =================================================

    const handleRename = async (): Promise<void> => {
        const newName = name.trim();

        if (!newName || newName === node.name || loading) {
            setRenaming(false);
            setName(node.name);
            return;
        }

        setLoading(true);

        try {
            const updatedFile = await updateItem(node.id, {
                name: newName,
            });

            if (updatedFile) {
                setRenaming(false);
            } else {
                setName(node.name);
                setRenaming(false);
            }
        } catch (error: unknown) {
            console.log("Rename file error:", error);
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // DELETE
    // =================================================

    const handleDelete = async (): Promise<void> => {
        if (loading) {
            return;
        }

        setLoading(true);

        try {
            await deleteItem(node.id);
        } catch (error: unknown) {
            console.log("Delete file error:", error);
        } finally {
            setLoading(false);
        }
    };

    // =================================================
    // KEYBOARD
    // =================================================

    const handleKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (e.key === "Enter") {
            e.preventDefault();
            void handleRename();
        }

        if (e.key === "Escape") {
            e.preventDefault();
            setRenaming(false);
            setName(node.name);
        }
    };

    // =================================================
    // RENDER
    // =================================================

    return (
        <>
            {/* FILE */}

            <motion.div
                onClick={() => openFile(node)}
                whileHover={{ x: 2 }}
                onContextMenu={handleContextMenu}
                className="group flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
            >
                <FileIcon
                    size={16}
                    className={`shrink-0 ${color}`}
                />

                {renaming ? (
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        disabled={loading}
                        onChange={(
                            e: ChangeEvent<HTMLInputElement>,
                        ) => {
                            setName(e.target.value);
                        }}
                        onBlur={() => {
                            void handleRename();
                        }}
                        onKeyDown={handleKeyDown}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        className="min-w-0 flex-1 rounded border border-sky-400/40 bg-white/5 px-1.5 py-0.5 text-[13px] text-white outline-none focus:ring-2 focus:ring-sky-400/10 disabled:opacity-50"
                    />
                ) : (
                    <span className="truncate text-[13px] text-zinc-400 transition-colors group-hover:text-white">
                        {node.name}
                    </span>
                )}
            </motion.div>

            {/* CONTEXT MENU */}

            {menu &&
                createPortal(
                    <>
                        {/* BACKDROP */}

                        <div
                            className="fixed inset-0 z-40"
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setMenu(null);
                            }}
                            onClick={() => {
                                setMenu(null);
                            }}
                        />

                        {/* MENU */}

                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.96,
                                y: -6,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            transition={{
                                duration: 0.14,
                                ease: "easeOut",
                            }}
                            style={{
                                left: menu.x,
                                top: menu.y,
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="fixed z-50 w-44 rounded-xl border border-white/8 bg-[#17171a]/95 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
                        >
                            {/* RENAME */}

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => {
                                    setMenu(null);
                                    setName(node.name);
                                    setRenaming(true);
                                }}
                                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-zinc-300 transition-colors hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                                className="mx-1 flex w-[calc(100%-8px)] items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 size={13} />
                                Delete
                            </button>
                        </motion.div>
                    </>,
                    document.body,
                )}
        </>
    );
};

export default FileItem;