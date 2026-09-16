import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { motion } from "motion/react";

import toast from "react-hot-toast";

import { FilePlus2, FolderPlus, FolderTree, RefreshCw } from "lucide-react";

import { useFile, type FileNode } from "../context/FileContext";

import Folder from "./Folder";
import FileItem from "./FileItem";

import { getLanguageFromExtension } from "../utils/language";

interface ExplorerProps {
    projectId: string;
    openFile: (file: FileNode) => void;
}

type CreatingType = "file" | "folder" | null;

const Explorer = ({ projectId, openFile }: ExplorerProps) => {

    const [creating, setCreating] = useState<CreatingType>(null);

    const [name, setName] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);

    const { refreshTree, tree, createRootFolder, createFile } = useFile();

    const createInputRef = useRef<HTMLInputElement>(null);

    // START CREATION

    const handleNewFolder = (): void => {
        setCreating("folder");
        setName("");
    };

    const handleNewFile = (): void => {
        setCreating("file");
        setName("");
    };

    // CANCEL CREATION

    const cancelCreation = (): void => {
        if (loading) {
            return;
        }

        setCreating(null);
        setName("");
    };

    // CREATE ROOT FOLDER

    const handleCreateFolder = async (): Promise<void> => {
        const trimmedName = name.trim();

        if (!trimmedName || loading) {
            return;
        }

        setLoading(true);

        try {
            const folder = await createRootFolder({
                projectId,
                name: trimmedName,
            });

            if (folder) {
                setCreating(null);
                setName("");
            }
        } catch (error: unknown) {
            console.log("Create root folder error:", error);

            const message = error instanceof Error ? error.message : "Failed to create folder.";

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    // CREATE ROOT FILE

    const handleCreateFile = async (): Promise<void> => {
        const trimmedName = name.trim();

        if (!trimmedName || loading) {
            return;
        }

        const extension = trimmedName.includes(".")
            ? trimmedName.split(".").pop() || ""
            : "";

        const language = getLanguageFromExtension(extension);

        setLoading(true);

        try {
            const file = await createFile({
                projectId,
                parentId: null,
                name: trimmedName,
                extension,
                language,
                content: "",
                size: 0,
            });

            if (file) {
                setCreating(null);
                setName("");
            }
        } catch (error: unknown) {
            console.log("Create root file error:", error);

            const message = error instanceof Error ? error.message : "Failed to create file.";

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    // KEYBOARD

    const handleKeyDown = (
        e: KeyboardEvent<HTMLInputElement>,
    ): void => {
        if (e.key === "Enter") {
            if (creating === "folder") {
                void handleCreateFolder();
            }

            if (creating === "file") {
                void handleCreateFile();
            }
        }

        if (e.key === "Escape") {
            cancelCreation();
        }
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
                if (!loading) {
                    setCreating(null);
                    setName("");
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
    }, [creating, loading]);

    return (
        <motion.div
            initial={{ opacity: 0, x: -16, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 240 }}
            exit={{ opacity: 0, x: -16, width: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-full flex-col overflow-hidden border-r border-white/6 bg-[#111113]/90 backdrop-blur-xl"
        >
            {/* HEADER */}

            <div className="flex h-10 w-full shrink-0 items-center justify-between border-b border-white/6 px-3">

                <span className="text-[11px] font-semibold tracking-wider text-zinc-500">
                    EXPLORER
                </span>

                <div className="flex items-center gap-0.5">

                    {/* NEW FILE */}

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNewFile}
                        className={`rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white ${creating === "file" ? "bg-white/[0.07] text-white" : ""}`}
                        title="New File"
                    >

                        <FilePlus2 size={14} />

                    </motion.button>

                    {/* NEW FOLDER */}

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNewFolder}
                        className={`rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white ${creating === "folder" ? "bg-white/[0.07] text-white" : ""}`}
                        title="New Folder"
                    >

                        <FolderPlus size={14} />

                    </motion.button>

                    {/* REFRESH */}

                    <motion.button
                        type="button"
                        whileHover={{ rotate: 60 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => void refreshTree()}
                        className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-white/[0.07] hover:text-white"
                        title="Refresh"
                    >

                        <RefreshCw size={14} />

                    </motion.button>

                </div>

            </div>

            {/* FILE TREE */}

            <div
                className="min-h-0 w-full flex-1 overflow-y-auto px-1 py-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/8 hover:[&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb]:transition-colors"
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255,255,255,0.1) transparent",
                }}
            >

                {/* ROOT CREATE INPUT */}

                {creating && (

                    <div className="mb-1 px-2 py-1">

                        <div className="flex items-center gap-1.5">

                            {creating === "folder" ? (

                                <FolderPlus
                                    size={16}
                                    className="shrink-0 text-sky-400"
                                />

                            ) : (

                                <FilePlus2
                                    size={16}
                                    className="shrink-0 text-zinc-400"
                                />

                            )}

                            <input
                                ref={createInputRef}
                                autoFocus
                                type="text"
                                value={name}
                                disabled={loading}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={creating === "folder" ? "Folder name" : "File name"}
                                className="min-w-0 flex-1 rounded-md border border-sky-400/30 bg-white/5 px-2 py-1 text-[13px] text-white placeholder-zinc-500 outline-none focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10 disabled:opacity-50"
                            />

                        </div>

                    </div>

                )}

                {/* EMPTY STATE */}

                {tree.length === 0 && !creating ? (

                    <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">

                        <FolderTree
                            size={22}
                            className="text-zinc-700"
                        />

                        <span className="text-[12px] text-zinc-600">
                            Empty workspace
                        </span>

                    </div>

                ) : (

                    tree.map((node) => {

                        if (node.type === "folder") {
                            return (
                                <Folder
                                    key={node.id}
                                    projectId={projectId}
                                    node={node}
                                    openFile={openFile}
                                />
                            );
                        }

                        return (
                            <FileItem
                                key={node.id}
                                node={node}
                                openFile={openFile}
                            />
                        );
                    })

                )}

            </div>

        </motion.div>
    );
};

export default Explorer;