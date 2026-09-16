import {
    FileMinus,
    FilePen,
    FilePlus2,
    FolderPlus,
    type LucideIcon,
} from "lucide-react";

import { motion } from "motion/react";

interface ToolBadgeProps {
    toolType: string;
    detail?: string;
}

interface ToolMeta {
    icon: LucideIcon;
    color: string;
    label: string;
}

const TOOL_META: Record<
    string,
    ToolMeta
> = {
    folder_created: {
        icon: FolderPlus,
        color: "text-sky-400",
        label: "Created folder",
    },

    file_created: {
        icon: FilePlus2,
        color: "text-emerald-400",
        label: "Created file",
    },

    file_updated: {
        icon: FilePen,
        color: "text-amber-400",
        label: "Updated file",
    },

    file_deleted: {
        icon: FileMinus,
        color: "text-red-400",
        label: "File deleted",
    },
};

const AiToolBadge = ({
    toolType,
    detail,
}: ToolBadgeProps) => {
    const meta = TOOL_META[toolType];

    if (!meta) {
        return null;
    }

    const Icon = meta.icon;

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -4,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            className="flex items-center justify-center"
        >
            <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/3 px-3 py-1 text-[11.5px] text-zinc-400">
                <Icon
                    size={12}
                    className={meta.color}
                />

                <span>
                    {meta.label}
                </span>

                {detail && (
                    <span className="text-zinc-600">
                        &middot; {detail}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

export default AiToolBadge;