import { useEffect, useMemo, useState, type Dispatch, type MouseEvent, type SetStateAction } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Circle, Loader2, Save, X } from "lucide-react";
import MonacoEditor from "@monaco-editor/react";

import { useFile, type FileNode } from "../context/FileContext";
import { getFileIcon } from "../utils/fileIcons";

interface EditorProps {
    activeTab: FileNode | null;
    openTabs: FileNode[];
    setActiveTab: Dispatch<SetStateAction<FileNode | null>>;
    setOpenTabs: Dispatch<SetStateAction<FileNode[]>>;
    drafts: Record<string, string>;
    setDrafts: Dispatch<SetStateAction<Record<string, string>>>;
}

const Editor = ({ activeTab, openTabs, setOpenTabs, setActiveTab, drafts, setDrafts }: EditorProps) => {
    const [code, setCode] = useState<string>("");
    const [saving, setSaving] = useState<boolean>(false);
    const [justSaved, setJustSaved] = useState<boolean>(false);

    const { updateItem } = useFile();

    const isDirty = useMemo(
        () => activeTab !== null && code !== (activeTab.content || ""),
        [code, activeTab],
    );

    useEffect(() => {
        if (!activeTab) {
            setCode("");
            return;
        }

        const draft = drafts[activeTab.id];

        setCode(draft ?? activeTab.content ?? "");
        setJustSaved(false);
    }, [activeTab, drafts]);

    const save = async (): Promise<void> => {
        if (!activeTab || saving || !isDirty) return;

        try {
            setSaving(true);

            const updatedItem = await updateItem(activeTab.id, {
                content: code,
                size: code.length,
            });

            if (!updatedItem) {
                return;
            }

            setDrafts((prev) => {
                const next = { ...prev };
                delete next[activeTab.id];
                return next;
            });

            setActiveTab({
                ...activeTab,
                content: code,
                size: code.length,
            });

            setOpenTabs((tabs) =>
                tabs.map((tab) =>
                    tab.id === activeTab.id
                        ? {
                            ...tab,
                            content: code,
                            size: code.length,
                        }
                        : tab,
                ),
            );

            setJustSaved(true);

            setTimeout(() => {
                setJustSaved(false);
            }, 1500);
        } catch (error: unknown) {
            console.log("Save file error:", error);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent): void => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                void save();
            }
        };

        window.addEventListener("keydown", handler);

        return () => {
            window.removeEventListener("keydown", handler);
        };
    }, [code, activeTab, saving, isDirty]);

    const closeTab = (e: MouseEvent<HTMLButtonElement>, tab: FileNode): void => {
        e.stopPropagation();

        const tabs = openTabs.filter((t) => t.id !== tab.id);

        setOpenTabs(tabs);

        setDrafts((prev) => {
            const next = { ...prev };
            delete next[tab.id];
            return next;
        });

        if (activeTab?.id === tab.id) {
            setActiveTab(
                tabs.length
                    ? tabs[tabs.length - 1]
                    : null,
            );
        }
    };

    const ActiveIcon = getFileIcon(activeTab?.name).icon;
    const activeIconColor = getFileIcon(activeTab?.name).color;

    if (!activeTab) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[#0a0a0c] text-zinc-600">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/6 bg-white/2">
                    <Circle size={22} className="text-zinc-700" />
                </div>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium text-zinc-400">
                        No file open
                    </span>

                    <span className="text-xs text-zinc-600">
                        Select a file from Explorer to start editing
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col bg-[#0a0a0c]">
            {/* TAB BAR */}

            <div className="flex h-10 shrink-0 items-center overflow-x-auto border-b border-white/6 bg-[#111113]/90">
                <AnimatePresence initial={false}>
                    {openTabs.map((tab) => {
                        const active = activeTab.id === tab.id;
                        const { icon: Icon, color } = getFileIcon(tab.name);

                        return (
                            <motion.div
                                key={tab.id}
                                initial={{
                                    opacity: 0,
                                    width: 0,
                                }}
                                animate={{
                                    opacity: 1,
                                    width: "auto",
                                }}
                                exit={{
                                    opacity: 0,
                                    width: 0,
                                }}
                                transition={{ duration: 0.15 }}
                                onClick={() => setActiveTab(tab)}
                                className={`group relative flex h-full cursor-pointer items-center gap-2 whitespace-nowrap border-r border-white/5 px-3.5 transition-colors ${active
                                    ? "bg-[#0a0a0c] text-white"
                                    : "text-zinc-500 hover:bg-white/2 hover:text-zinc-300"
                                    }`}
                            >
                                <Icon
                                    size={14}
                                    className={color}
                                />

                                <span className="text-[13px]">
                                    {tab.name}
                                </span>

                                {active && isDirty && (
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                                )}

                                <button
                                    onClick={(e) => closeTab(e, tab)}
                                    className="rounded p-0.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
                                >
                                    <X size={13} />
                                </button>

                                {active && (
                                    <motion.div
                                        layoutId="active-tab-indicator"
                                        className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-sky-400 to-violet-400"
                                        transition={{
                                            duration: 0.2,
                                            ease: "easeOut",
                                        }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* TOOLBAR */}

            <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/6 px-4">
                <div className="flex items-center gap-2 text-zinc-400">
                    <ActiveIcon
                        size={14}
                        className={activeIconColor}
                    />

                    <span className="text-[13px]">
                        {activeTab.name}
                    </span>

                    {isDirty && (
                        <span className="text-[11px] text-zinc-600">
                            &bull; unsaved
                        </span>
                    )}
                </div>

                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void save()}
                    disabled={saving || !isDirty}
                    className="flex items-center gap-2 rounded-lg bg-linear-to-b from-sky-500 to-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset] transition-colors hover:from-sky-400 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <AnimatePresence initial={false}>
                        {saving ? (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Loader2
                                    size={13}
                                    className="animate-spin"
                                />
                                Saving...
                            </motion.span>
                        ) : justSaved ? (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Check size={13} />
                                Saved
                            </motion.span>
                        ) : (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <Save size={13} />
                                Save
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            {/* MONACO */}

            <div className="min-h-0 flex-1">
                <MonacoEditor
                    height="100%"
                    theme="vs-dark"
                    language={activeTab.language || "plaintext"}
                    value={code}
                    onChange={(value) => {
                        const newCode = value || "";
                        setCode(newCode);
                        setDrafts((prev) => ({ ...prev, [activeTab.id]: newCode }));
                    }}
                    options={{
                        fontSize: 14,
                        automaticLayout: true,
                        minimap: {
                            enabled: false,
                        },
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        padding: {
                            top: 12,
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default Editor;