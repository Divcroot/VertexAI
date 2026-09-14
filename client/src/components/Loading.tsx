import { Loader2 } from "lucide-react";

const Loading = () => {

    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#07070c]">

            {/* Ambient glow */}

            <div className="pointer-events-none absolute -top-40 left-1/3 hidden h-96 w-96 rounded-full bg-sky-500/10 blur-[140px] dark:block" />

            <div className="pointer-events-none absolute right-0 top-1/3 hidden h-80 w-80 rounded-full bg-violet-500/10 blur-[130px] dark:block" />

            <div className="relative flex flex-col items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">

                    <Loader2
                        size={20}
                        className="animate-spin text-slate-500 dark:text-zinc-400"
                    />

                </div>

                <div className="flex flex-col items-center gap-1">

                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                        Loading Dashboard
                    </span>

                    <span className="text-xs text-slate-400 dark:text-zinc-600">
                        Preparing your workspace...
                    </span>

                </div>

            </div>

        </div>
    )
}

export default Loading;