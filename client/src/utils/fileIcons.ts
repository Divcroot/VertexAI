import { FileText, Settings2, Image as ImageIcon, KeyRound, GitBranch, Package, Lock, File as FileIcon } from "lucide-react";

import { IoLogoJavascript, IoLogoReact } from "react-icons/io5";
import { SiTypescript } from "react-icons/si";
import { BsFiletypeJson } from "react-icons/bs";
import { FaCss3, FaHtml5 } from "react-icons/fa";
import { AiOutlinePython } from "react-icons/ai";

import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

interface FileIconData {
    icon: ComponentType<LucideProps>;
    color: string;
}

export const getFileIcon = (name: string = ""): FileIconData => {
    const lower = name.toLowerCase();
    const ext = lower.split(".").pop() ?? "";

    const knownNames: Record<string, FileIconData> = {
        "package.json": {
            icon: Package,
            color: "text-emerald-400",
        },

        "package-lock.json": {
            icon: Lock,
            color: "text-zinc-500",
        },

        ".gitignore": {
            icon: GitBranch,
            color: "text-orange-500",
        },

        ".gitattributes": {
            icon: GitBranch,
            color: "text-orange-500",
        },

        ".env": {
            icon: KeyRound,
            color: "text-lime-400",
        },
    };

    if (knownNames[lower]) {
        return knownNames[lower];
    }

    const map: Record<string, FileIconData> = {
        js: {
            icon: IoLogoJavascript,
            color: "text-yellow-400",
        },

        mjs: {
            icon: IoLogoJavascript,
            color: "text-yellow-400",
        },

        cjs: {
            icon: IoLogoJavascript,
            color: "text-yellow-400",
        },

        jsx: {
            icon: IoLogoReact,
            color: "text-sky-400",
        },

        ts: {
            icon: SiTypescript,
            color: "text-blue-400",
        },

        tsx: {
            icon: IoLogoReact,
            color: "text-blue-600",
        },

        json: {
            icon: BsFiletypeJson,
            color: "text-amber-400",
        },

        css: {
            icon: FaCss3,
            color: "text-violet-400",
        },

        html: {
            icon: FaHtml5,
            color: "text-orange-400",
        },

        py: {
            icon: AiOutlinePython,
            color: "text-emerald-400",
        },

        yml: {
            icon: Settings2,
            color: "text-rose-400",
        },

        png: {
            icon: ImageIcon,
            color: "text-green-400",
        },

        jpg: {
            icon: ImageIcon,
            color: "text-green-400",
        },

        jpeg: {
            icon: ImageIcon,
            color: "text-green-400",
        },

        txt: {
            icon: FileText,
            color: "text-zinc-400",
        },
    };

    return map[ext] ?? {
        icon: FileIcon,
        color: "text-zinc-500",
    };
};

export const getFolderColor = (name: string = ""): string => {
    const key = name.toLowerCase();

    const map: Record<string, string> = {
        src: "text-sky-400",
        public: "text-emerald-400",
        images: "text-pink-400",
        img: "text-pink-400",
        assets: "text-pink-400",
        css: "text-violet-400",
        styles: "text-violet-400",
        js: "text-yellow-400",
        scripts: "text-yellow-400",
        components: "text-sky-400",
        pages: "text-sky-400",
        utils: "text-amber-400",
        hooks: "text-teal-400",
        node_modules: "text-zinc-600",
        dist: "text-zinc-500",
        build: "text-zinc-500",
    };

    return map[key] ?? "text-sky-400";
};