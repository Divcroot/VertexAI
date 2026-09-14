import { useState, type SetStateAction } from "react";

import { AnimatePresence, motion } from "motion/react";

import { useNavigate } from "react-router-dom";

import { Code2, Eye, SquareTerminal } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useProjects } from "../context/ProjectContext";

interface TopBarProps {
    showPreview: boolean;
    showBottomPanel: boolean;
    setShowPreview: React.Dispatch<SetStateAction<boolean>>;
    setShowBottomPanel: React.Dispatch<SetStateAction<boolean>>;
}

const TopBar = ({ showPreview, setShowPreview, showBottomPanel, setShowBottomPanel }: TopBarProps) => {

    const [profileOpen, setProfileOpen] = useState<boolean>(false);

    const navigate = useNavigate();

    const { user } = useAuth();
    const { currentProject } = useProjects();

    const initials = user?.name
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <div className="relative z-50 flex h-12 items-center justify-between border-b border-white/6 bg-[#111113]/90 px-4 backdrop-blur-xl">

            {/* LEFT: LOGO + PROJECT */}

            <div className="flex items-center gap-3">

                <div
                    onClick={() => navigate("/")}
                    className="text-white text-lg font-bold cursor-pointer"
                >

                    Vertex AI

                </div>

                <div className="h-4 w-px bg-white/10" />

                <div className="flex items-center gap-2">

                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[13px]">
                        📁
                    </div>

                    <span className="max-w-55 truncate text-sm font-medium text-zinc-300">
                        {currentProject?.name}
                    </span>

                </div>

            </div>

            {/* RIGHT: TOGGLES + PROFILE */}

            <div className="flex items-center gap-1.5">

                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPreview((v) => !v)}
                    title={showPreview ? "Show Editor" : "Show Preview"}
                    className={`relative flex items-center justify-center rounded-lg p-2 transition-colors ${showPreview ? "text-sky-400" : "text-zinc-400 hover:text-zinc-200"}`}
                >

                    {showPreview && (

                        <motion.div
                            className="absolute inset-0 rounded-lg bg-white/6"
                            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                        />

                    )}

                    {showPreview ? <Eye size={16} className="relative" /> : <Code2 size={16} className="relative" />}

                </motion.button>

                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBottomPanel((v) => !v)}
                    title={showBottomPanel ? "Hide Terminal" : "Show Terminal"}
                    className={`relative flex items-center justify-center rounded-lg p-2 transition-colors ${showBottomPanel ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"}`}
                >

                    {showBottomPanel && (

                        <motion.div className="absolute inset-0 rounded-lg bg-white/6"
                            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                        />

                    )}

                    <SquareTerminal size={16} className="relative" />

                </motion.button>

                <div className="mx-1 h-5 w-px bg-white/10" />

                {/* PROFILE */}

                <div>

                    <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setProfileOpen((v) => !v)}
                        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-white/5"
                    >

                        {user?.avatar ? (

                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-7 w-7 shrink-0 rounded-full border border-white/10 object-cover"
                            />

                        ) : (

                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-violet-400 text-[11px] font-semibold text-white">
                                {initials}
                            </div>

                        )}

                    </motion.button>

                    <AnimatePresence>

                        {profileOpen && (

                            <>

                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setProfileOpen(false)}
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                                    transition={{ duration: 0.14, ease: "easeOut" }}
                                    className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-white/8 bg-[#17171a]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl"
                                >

                                    <div className="flex items-center gap-3">

                                        {user?.avatar ? (

                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="h-10 w-10 shrink-0 rounded-full border border-white/10 object-cover"
                                            />

                                        ) : (

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-400 to-violet-400 text-[12px] font-semibold text-white">
                                                {initials}
                                            </div>

                                        )}

                                        <div className="min-w-0">

                                            <p className="truncate text-[13px] font-medium text-white">
                                                {user?.name}
                                            </p>

                                            <p className="truncate text-[11.5px] text-zinc-500">
                                                {user?.email}
                                            </p>

                                        </div>

                                    </div>

                                </motion.div>

                            </>
                        )}

                    </AnimatePresence>

                </div>

            </div>

        </div>
    )
}

export default TopBar;