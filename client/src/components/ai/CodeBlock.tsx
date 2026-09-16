import {
    Check,
    Copy,
} from "lucide-react";
import {
    useState,
} from "react";

import {
    Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
    language?: string;
    code: string;
}

const CodeBlock = ({
    language,
    code,
}: CodeBlockProps) => {
    const [copied, setCopied] =
        useState(false);

    const handleCopy =
        async (): Promise<void> => {
            try {
                await navigator.clipboard.writeText(
                    code,
                );

                setCopied(true);

                window.setTimeout(() => {
                    setCopied(false);
                }, 1500);
            } catch (error: unknown) {
                console.error(
                    "Failed to copy code:",
                    error,
                );
            }
        };

    return (
        <div className="my-2 overflow-hidden rounded-lg border border-white/8 bg-[#0a0a0c]">
            <div className="flex items-center justify-between border-b border-white/6 bg-white/3 px-3 py-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {language || "text"}
                </span>

                <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
                >
                    {copied ? (
                        <>
                            <Check
                                size={11}
                                className="text-emerald-400"
                            />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy size={11} />
                            Copy
                        </>
                    )}
                </button>
            </div>

            <SyntaxHighlighter
                language={
                    language || "text"
                }
                style={oneDark}
                customStyle={{
                    margin: 0,
                    background:
                        "transparent",
                    padding:
                        "10px 12px",
                    fontSize: "12.5px",
                }}
                wrapLongLines
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};

export default CodeBlock;