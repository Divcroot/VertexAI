import { useEffect, useRef, useState } from "react";

import { Sun, Moon, ChevronDown, LogOut } from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Navbar = () => {

    const [isDark, setIsDark] = useState<boolean>(() => {
        const savedTheme = localStorage.getItem("theme");
        return savedTheme === null || savedTheme === "dark";
    });
    const [menuOpen, setMenuOpen] = useState<boolean>(false);

    const menuRef = useRef<HTMLDivElement>(null);

    const { user, logout } = useAuth();

    const initials = user?.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    useEffect(() => {
        const onClickOutside = (e: MouseEvent): void => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onClickOutside);

        return () => {
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, []);

    const toggleTheme = (): void => {
        const next = !isDark;

        setIsDark(next);

        document.documentElement.classList.toggle("dark", next);

        localStorage.setItem("theme", next ? "dark" : "light");
    };

    return (
        <nav className="w-full h-16 bg-white/70 dark:bg-white/3 backdrop-blur-xl border-b border-slate-200/70 dark:border-white/7 flex items-center px-6 gap-6 font-sans transition-colors z-100 duration-300">

            {/* Left: Logo */}

            <div className="flex items-center shrink-0">

                <span className="text-slate-900 dark:text-white font-bold text-[17px] tracking-tight">
                    Vertex AI
                </span>

            </div>

            <div className="flex-1" />

            {/* Right: actions */}

            <div className="flex items-center gap-2 shrink-0">

                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/6 transition-colors duration-150"
                >

                    {isDark ? <Sun size={18} /> : <Moon size={18} />}

                </button>

                <div className="relative ml-1" ref={menuRef}>

                    <button
                        onClick={() => setMenuOpen((prev) => (!prev))}
                        className="flex items-center gap-2 pl-1.5 pr-2 h-10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/6 transition-colors duration-150">

                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-slate-600 to-slate-700 dark:from-slate-200 dark:to-white flex items-center justify-center overflow-hidden ring-1 ring-black/5 dark:ring-white/20">

                            <span className="text-[12px] font-semibold text-white dark:text-slate-900">
                                {initials}
                            </span>

                        </div>

                        <span className="text-[13.5px] font-medium text-slate-700 dark:text-slate-200 hidden sm:inline">
                            {user?.name}
                        </span>

                        <ChevronDown size={14} className={`text-slate-400 dark:text-slate-500 transition-transform duration-150 ${menuOpen ? "rotate-180" : ""
                            }`} />

                    </button>

                    {menuOpen && (

                        <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-[#12121c]/95 backdrop-blur-xl border z-199 border-slate-200 dark:border-white/8 rounded-xl shadow-xl py-1.5 animate-[fadeIn_0.15s_ease-out]">

                            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-white/6 flex items-center gap-2.5">

                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-slate-600 to-slate-700 dark:from-slate-200 dark:to-white flex items-center justify-center shrink-0 ring-1 ring-black/5 dark:ring-white/20">

                                    <span className="text-[12px] font-semibold text-white dark:text-slate-900">
                                        {initials}
                                    </span>

                                </div>

                                <div className="min-w-0">

                                    <p className="text-[13px] font-medium text-slate-800 dark:text-slate-200 truncate">
                                        {user?.name}
                                    </p>

                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                        {user?.email}
                                    </p>

                                </div>

                            </div>

                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    logout();
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150"
                            >

                                <LogOut size={15} />

                                Logout

                            </button>

                        </div>
                    )}

                </div>

            </div>

        </nav>
    )
}

export default Navbar;