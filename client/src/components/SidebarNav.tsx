import { Folder, Star } from "lucide-react";

import { motion } from "motion/react";

type Section = "Projects" | "Starred";

interface SidebarNavProps {
    activeSection: Section;
    setActiveSection: React.Dispatch<React.SetStateAction<Section>>;
}

const mainNav: {
    label: Section;
    icon: typeof Folder;
}[] = [
        {
            label: "Projects",
            icon: Folder,
        },
        {
            label: "Starred",
            icon: Star,
        },
    ];

const SidebarNav = ({ activeSection, setActiveSection }: SidebarNavProps) => {

    return (
        <>
            {mainNav.map(({ label, icon: Icon }) => {

                const isActive = activeSection === label;

                return (
                    <motion.button
                        type="button"
                        key={label}
                        onClick={() => setActiveSection(label)}
                        whileTap={{ scale: 0.97 }}
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150 ${isActive ? "text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/4 dark:hover:text-slate-200"}`}
                    >

                        {isActive && (

                            <motion.div
                                layoutId="sidebar-active-pill"
                                className="absolute inset-0 rounded-lg border border-slate-900/10 bg-slate-900/5 dark:border-white/10 dark:bg-white/10"
                                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                            />

                        )}

                        <Icon size={17} strokeWidth={2} className="relative" />

                        <span className="relative">
                            {label}
                        </span>

                    </motion.button>
                )
            })}
        </>
    )
}

export default SidebarNav