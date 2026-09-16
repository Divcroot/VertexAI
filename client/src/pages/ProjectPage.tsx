import { useEffect, useState } from "react";

import { motion, AnimatePresence } from "motion/react";

import { useParams } from "react-router-dom";

import { Bot, Code2, Eye, Files, Loader2, Maximize2, Minimize2, RefreshCw, TerminalSquare } from "lucide-react";

import { useProjects } from "../context/ProjectContext";
import { useFile, type FileNode } from "../context/FileContext";

import TopBar from "../components/TopBar";
import ActivityBar from "../components/ActivityBar";
import Explorer from "../components/Explorer";
import Preview from "../components/Preview";
import Editor from "../components/Editor";
import BottomPannel from "../components/BottomPannel";
import AiChat from "../components/ai/AiChat";
import toast from "react-hot-toast";

const ProjectPage = () => {

    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [showBottomPanel, setShowBottomPanel] = useState<boolean>(true);
    const [showExplorer, setShowExplorer] = useState<boolean>(true);
    const [showAIChat, setShowAIChat] = useState<boolean>(true);
    const [isPreviewFullscreen, setIsPreviewFullscreen] = useState<boolean>(false);

    const [previewRefreshKey, setPreviewRefreshKey] = useState<number>(0);

    const [openTabs, setOpenTabs] = useState<FileNode[]>([]);

    const [activeTab, setActiveTab] = useState<FileNode | null>(null);

    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const [mobilePane, setMobilePane] = useState<"explorer" | "editor" | "chat">("editor");

    const { id } = useParams<{ id: string }>();

    const { projects, currentProject, setCurrentProject, loading } = useProjects();
    const { tree, getFile } = useFile();

    const findNodeById = (
        nodes: FileNode[],
        id: string,
    ): FileNode | undefined => {
        for (const node of nodes) {
            if (node.id === id) {
                return node;
            }

            const found = findNodeById(node.children, id);

            if (found) {
                return found;
            }
        }

        return undefined;
    };

    const openFile = async (file: FileNode): Promise<void> => {
        try {
            const fullFile = await getFile(file.id);

            if (!fullFile) {
                toast.error("Unable to open file.");
                return;
            }

            const fileNode: FileNode = {
                ...file,
                content: fullFile.content,
                size: fullFile.size,
            };

            const existingTab = openTabs.find(
                (tab) => tab.id === file.id,
            );

            if (existingTab) {
                setActiveTab({
                    ...existingTab,
                    content: fullFile.content,
                    size: fullFile.size,
                });
                return;
            }

            setOpenTabs((tabs) => [...tabs, fileNode]);
            setActiveTab(fileNode);
            setShowPreview(false);
            setMobilePane("editor");
        } catch (error) {
            console.log("Open file error:", error);

            const message = error instanceof Error ? error.message : "Failed to open file.";

            toast.error(message);
        }
    };

    useEffect(() => {
        if (!id || loading || currentProject?._id === id) return;

        const project = projects.find((project) => project._id === id);

        if (project) {
            setCurrentProject(project);
        } else {
            setCurrentProject(null);
        }

    }, [id, projects, loading, setCurrentProject, currentProject?._id])

    useEffect(() => {
        setOpenTabs((tabs) =>
            tabs.filter((tab) => findNodeById(tree, tab.id)),
        );

        setActiveTab((currentTab) => {
            if (!currentTab) {
                return null;
            }

            const exists = findNodeById(tree, currentTab.id);

            return exists ? currentTab : null;
        });
    }, [tree]);

    const hasActiveFile = activeTab !== null;

    if (loading) {
        return (
            <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0a0a0c]">

                <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-96 w-96 rounded-full bg-sky-500/25 blur-[140px] md:block" />

                <div className="pointer-events-none absolute -top-20 right-1/4 hidden h-80 w-80 rounded-full bg-violet-500/25 blur-[140px] md:block" />

                <div className="flex items-center gap-2">

                    <Loader2 size={16} />

                    <span className="text-sm font-medium text-zinc-300">
                        Loading Project...
                    </span>

                </div>

            </div>
        )
    }

    if (!currentProject) {
        return (
            <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#0a0a0c]">

                <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-96 w-96 rounded-full bg-sky-500/25 blur-[140px] md:block" />

                <div className="pointer-events-none absolute -top-20 right-1/4 hidden h-80 w-80 rounded-full bg-violet-500/25 blur-[140px] md:block" />

                <div className="flex items-center">
                    <span className="text-sm font-medium text-zinc-300">
                        Project Not Found
                    </span>

                </div>

            </div>
        )
    }

    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0c]">

            <div className="pointer-events-none absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-sky-500/25 blur-[140px] md:block" />

            <div className="pointer-events-none absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-violet-500/25 blur-[140px] md:block" />

            {/* TOP BAR */}

            <TopBar
                showPreview={showPreview}
                setShowPreview={setShowPreview}
                showBottomPanel={showBottomPanel}
                setShowBottomPanel={setShowBottomPanel}
            />

            {/* Activity Bar, Explorer, Main Part, Ai Chat */}

            <div className="relative flex min-h-0 flex-1 overflow-hidden">

                {/* Activity Bar */}

                <div className="hidden md:block">

                    <ActivityBar
                        showExplorer={showExplorer}
                        setShowExplorer={setShowExplorer}
                        showBottomPanel={showBottomPanel}
                        setShowBottomPanel={setShowBottomPanel}
                        showAIChat={showAIChat}
                        setShowAIChat={setShowAIChat}
                    />

                </div>

                {/* EXPLORER */}

                <div className="hidden md:flex md:w-auto">

                    <AnimatePresence initial={false}>

                        {showExplorer && (

                            <Explorer
                                projectId={currentProject._id}
                                openFile={openFile}
                            />

                        )}

                    </AnimatePresence>

                </div>

                {/* MOBILE EXPLORER */}

                {mobilePane === "explorer" && (
                    <>
                        <div
                            className="absolute inset-0 z-40 bg-black/50 md:hidden"
                            onClick={() => setMobilePane("editor")}
                        />

                        <div className="absolute inset-y-0 left-0 z-50 w-[78%] max-w-80 md:hidden">

                            {showExplorer && (

                                <Explorer
                                    projectId={currentProject._id}
                                    openFile={openFile}
                                />

                            )}

                        </div>
                    </>
                )}

                {/* Main Part */}

                <div className="relative flex w-full min-w-0 flex-1 flex-col overflow-hidden border-x border-white/5">

                    {/* Right Side Buttons */}

                    <div className="pointer-events-none absolute right-2 top-2 z-40 flex items-center gap-1.5 sm:right-4 sm:top-3 sm:gap-2">

                        {/* Refresh Button */}

                        {showPreview && hasActiveFile && (

                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                type="button"
                                onClick={() => setPreviewRefreshKey((key) => key + 1)}
                                title="Refresh preview"
                                className="pointer-events-auto flex items-center justify-center rounded-lg border border-white/10 bg-[#111113]/95 p-1.5 text-zinc-400 shadow-lg shadow-black/40 backdrop-blur hover:text-white sm:p-2"
                            >

                                <RefreshCw size={13} />

                            </motion.button>

                        )}

                        {/* FullScreen Button */}

                        {showPreview && hasActiveFile && (

                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                type="button"
                                onClick={() => setIsPreviewFullscreen((v) => !v)}
                                title={isPreviewFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
                                className="pointer-events-auto flex items-center justify-center rounded-lg border border-white/10 bg-[#111113]/95 p-1.5 text-zinc-400 shadow-lg shadow-black/40 backdrop-blur hover:text-white sm:p-2"
                            >

                                {isPreviewFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}

                            </motion.button>

                        )}

                        {/* Editor & Preview Button */}

                        <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#111113]/95 p-1 shadow-lg shadow-black/40 backdrop-blur">

                            <button
                                type="button"
                                onClick={() => {
                                    setShowPreview(false);
                                    setIsPreviewFullscreen(false);
                                }}
                                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${!showPreview ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                            >

                                {!showPreview && (

                                    <motion.div
                                        className="absolute inset-0 rounded-md bg-linear-to-b from-zinc-700 to-zinc-800"
                                        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                                    />

                                )}

                                <Code2 size={13} className="relative" />

                                <span className="relative hidden sm:inline">Editor</span>

                            </button>

                            <button
                                type="button"
                                disabled={!hasActiveFile}
                                onClick={() => {
                                    if (hasActiveFile) setShowPreview(true);
                                }}
                                className={`relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${showPreview ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                            >

                                {showPreview && hasActiveFile && (

                                    <motion.div
                                        className="absolute inset-0 rounded-md bg-linear-to-b from-zinc-700 to-zinc-800"
                                        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                                    />

                                )}

                                <Eye size={13} className="relative" />

                                <span className="relative hidden sm:inline">Preview</span>

                            </button>

                        </div>

                    </div>

                    {/* EDITOR / PREVIEW BODY */}

                    <div className="flex min-h-0 flex-1 overflow-hidden">

                        {showPreview && activeTab ? (

                            <Preview
                                tree={tree}
                                refreshKey={previewRefreshKey}
                            />

                        ) : (

                            <Editor
                                activeTab={activeTab}
                                openTabs={openTabs}
                                setOpenTabs={setOpenTabs}
                                setActiveTab={setActiveTab}
                                drafts={drafts}
                                setDrafts={setDrafts}
                            />

                        )}

                    </div>

                    {/* FULLSCREEN PREVIEW OVERLAY */}

                    <AnimatePresence>

                        {showPreview && hasActiveFile && isPreviewFullscreen && (

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                className="fixed inset-0 z-100 bg-white"
                            >
                                <Preview tree={tree} refreshKey={previewRefreshKey} />

                                <div className="absolute right-2 top-2 z-110 flex items-center gap-1.5 sm:right-4 sm:top-3">

                                    <button
                                        type="button"
                                        onClick={() => setPreviewRefreshKey((key) => key + 1)}
                                        title="Refresh preview"
                                        className="flex items-center justify-center rounded-lg border border-white/10 bg-[#111113]/95 p-2 text-zinc-300 shadow-lg shadow-black/40 backdrop-blur hover:text-white"
                                    >

                                        <RefreshCw size={13} />

                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsPreviewFullscreen(false)}
                                        title="Exit fullscreen (Esc)"
                                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#111113]/95 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 shadow-lg shadow-black/40 backdrop-blur hover:text-white sm:px-3 sm:text-xs"
                                    >

                                        <Minimize2 size={13} />

                                        <span className="hidden xs:inline">
                                            Exit Fullscreen
                                        </span>

                                    </button>

                                </div>

                            </motion.div>

                        )}

                    </AnimatePresence>

                    {/* BOTTOM PANEL (TERMINAL) */}

                    <AnimatePresence>

                        {showBottomPanel && (

                            <div className="max-h-[45vh] md:max-h-none">

                                <BottomPannel
                                    projectId = {currentProject._id}
                                    onClose={() => setShowBottomPanel(false)}
                                />

                            </div>

                        )}

                    </AnimatePresence>

                </div>

                {/* AI CHAT */}

                <div className="hidden md:flex md:w-auto">

                    <AnimatePresence initial={false}>

                        {showAIChat && (

                            <AiChat
                                projectId={currentProject._id}
                            />

                        )}

                    </AnimatePresence>

                </div>

                {/* MOBILE AI CHAT */}

                {mobilePane === "chat" && (
                    <>
                        <div
                            className="absolute inset-0 z-90 bg-black/50 md:hidden"
                            onMouseDown={() => setMobilePane("editor")}
                        />

                        <div className="absolute inset-y-0 right-0 z-100 flex w-[90%] justify-end md:hidden">

                            {showAIChat && (

                                <div
                                    className="h-full w-full max-w-80"
                                    onMouseDown={(e) => e.stopPropagation()}
                                >

                                    <AiChat
                                        projectId={currentProject._id}
                                    />

                                </div>

                            )}

                        </div>
                    </>
                )}

            </div>

            {/* MOBILE BOTTOM TAB BAR */}

            <div className="flex items-center justify-around border-t border-white/6 bg-[#0f0f12] py-2 md:hidden">

                <button
                    type="button"
                    onClick={() => setMobilePane("explorer")}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${mobilePane === "explorer" ? "text-white" : "text-zinc-500"}`}
                >

                    <Files size={18} />

                    Files

                </button>

                <button
                    type="button"
                    onClick={() => setMobilePane("editor")}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${mobilePane === "editor" ? "text-white" : "text-zinc-500"}`}
                >

                    <Code2 size={18} />

                    Code

                </button>

                <button
                    type="button"
                    onClick={() => setMobilePane("chat")}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${mobilePane === "chat" ? "text-white" : "text-zinc-500"}`}
                >

                    <Bot size={18} />

                    AI Chat

                </button>

                <button
                    type="button"
                    onClick={() => {
                        setMobilePane("editor");
                        setShowBottomPanel((value) => !value);
                    }}
                    className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-medium transition-colors ${showBottomPanel
                        ? "text-white"
                        : "text-zinc-500"
                        }`}
                >

                    <TerminalSquare size={18} />

                    Terminal

                </button>
            </div>

        </div>
    )
}

export default ProjectPage;
