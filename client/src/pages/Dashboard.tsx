import { useState } from "react";

import { FolderOpen, Loader2, Plus } from "lucide-react";

import Login from "../components/Login";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProjectCard from "../components/ProjectCard";
import CreateProjectModel from "../components/CreateProjectModal";
import Loading from "../components/Loading";

import { useProjects } from "../context/ProjectContext";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {

    const [activeSection, setActiveSection] = useState<"Projects" | "Starred">("Projects");

    const [openModal, setOpenModal] = useState<boolean>(false);

    const { user, loading } = useAuth();
    const { projects, starredProjects, loading: loadingProjects } = useProjects();

    if (loading) {
        return <Loading />
    }

    if (!user) {
        return <Login />
    }

    const displayedProjects = activeSection === "Starred" ? starredProjects : projects;

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-slate-50 transition-colors duration-300 dark:bg-[#07070c]">

            {/* Ambient glow */}

            <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-175 w-175 rounded-full bg-white/4 blur-[140px] dark:block" />

            <div className="pointer-events-none absolute right-0 top-1/3 hidden h-125 w-125 rounded-full bg-white/3 blur-[130px] dark:block" />

            <div className="relative flex min-h-0 flex-1 flex-col">

                {/* Navbar */}

                <Navbar />

                <div className="relative flex min-h-0 flex-1">

                    {/* Sidebar */}

                    <div className="hidden md:block">

                        <Sidebar
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            credits={user.credits}
                        />

                    </div>

                    {/* Main Part */}

                    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 scrollbar-thin [scrollbar-color:rgba(100,116,139,0.35)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-solid [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20">

                        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">

                            <div>

                                <h1 className="flex items-center gap-2 text-xl sm:text-2xl lg:text-[26px] font-bold text-slate-900 dark:text-white">
                                    Welcome back,
                                    {" "}
                                    {user.name.split(" ")[0] || "there"}
                                    <span>
                                        👋
                                    </span>
                                </h1>

                                <p className="mt-1 text-[13px] sm:text-[13.5px] text-slate-500 dark:text-slate-400">
                                    Ready to build something
                                    amazing today?
                                </p>

                            </div>

                            <button
                                onClick={() => setOpenModal(true)}
                                className="flex w-full sm:w-auto shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-opacity duration-150 hover:opacity-90 dark:bg-white dark:text-slate-900"
                            >

                                <Plus size={16} />
                                New Project

                            </button>

                        </div>

                        {/* PROJECT HEADING */}

                        <div className="mb-4 flex items-center">

                            <h2 className="text-[15px] sm:text-[16px] font-semibold text-slate-900 dark:text-white">
                                {activeSection === "Starred" ? "Starred Projects" : "Recent Projects"}
                            </h2>

                        </div>

                        {/* LOADING */}

                        {loadingProjects ? (

                            <div>
                                <Loader2 size={28} className="animate-spin text-slate-400 dark:text-slate-500" />
                            </div>

                        ) : displayedProjects?.length > 0 ? (

                            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">

                                {displayedProjects.map((project) => (

                                    <ProjectCard
                                        key={project._id}
                                        project={project}
                                    />

                                ))}

                            </div>

                        ) : (

                            <div className="mb-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 px-4 py-12 sm:py-16 text-center dark:border-white/10 dark:bg-white/1">

                                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/5 dark:bg-white/10">

                                    <FolderOpen size={24} className=" text-slate-500 dark:text-white" />

                                </div>

                                <h3 className="mb-1.5 text-[15px] sm:text-[16px] font-semibold text-slate-900 dark:text-white">

                                    {activeSection === "Starred" ? "No starred projects" : "No projects yet"}

                                </h3>

                                <p className="mb-5 max-w-xs text-[13px] text-slate-500 dark:text-slate-500">

                                    {activeSection === "Starred" ? "Star a project to see it here." : "Create your first project and start building something amazing!"}

                                </p>

                                {activeSection === "Projects" && (

                                    <button
                                        onClick={() => setOpenModal(true)}
                                        className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-[13.5px] font-semibold text-white shadow-sm transition-opacity duration-150 hover:opacity-90 dark:bg-white dark:text-slate-900">

                                        <Plus size={16} />

                                        Create Project

                                    </button>

                                )}

                            </div>
                        )}

                    </main>

                </div>

            </div>

            {openModal && (

                <CreateProjectModel
                    onClose={() => setOpenModal(false)}
                />

            )}

        </div>
    )
}

export default Dashboard;