import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import CodeBlock from "./CodeBlock";

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer = ({
    content,
}: MarkdownRendererProps) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: ({ children }) => (
                    <p className="mb-2 leading-relaxed last:mb-0">
                        {children}
                    </p>
                ),

                strong: ({ children }) => (
                    <strong className="font-semibold text-white">
                        {children}
                    </strong>
                ),

                em: ({ children }) => (
                    <em className="italic text-zinc-300">
                        {children}
                    </em>
                ),

                a: ({
                    children,
                    href,
                }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
                    >
                        {children}
                    </a>
                ),

                ul: ({ children }) => (
                    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">
                        {children}
                    </ul>
                ),

                ol: ({ children }) => (
                    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">
                        {children}
                    </ol>
                ),

                li: ({ children }) => (
                    <li className="leading-relaxed">
                        {children}
                    </li>
                ),

                h1: ({ children }) => (
                    <h1 className="mb-2 mt-3 text-[16px] font-semibold text-white first:mt-0">
                        {children}
                    </h1>
                ),

                h2: ({ children }) => (
                    <h2 className="mb-2 mt-3 text-[15px] font-semibold text-white first:mt-0">
                        {children}
                    </h2>
                ),

                h3: ({ children }) => (
                    <h3 className="mb-1.5 mt-2.5 text-[13.5px] font-semibold text-white first:mt-0">
                        {children}
                    </h3>
                ),

                blockquote: ({
                    children,
                }) => (
                    <blockquote className="mb-2 border-l-2 border-sky-400/40 pl-3 italic text-zinc-400 last:mb-0">
                        {children}
                    </blockquote>
                ),

                hr: () => (
                    <hr className="my-3 border-white/10" />
                ),

                table: ({ children }) => (
                    <div className="mb-2 overflow-x-auto rounded-lg border border-white/8">
                        <table className="w-full border-collapse text-[12.5px]">
                            {children}
                        </table>
                    </div>
                ),

                thead: ({
                    children,
                }) => (
                    <thead className="bg-white/4">
                        {children}
                    </thead>
                ),

                th: ({ children }) => (
                    <th className="border-b border-white/8 px-2.5 py-1.5 text-left font-semibold text-zinc-300">
                        {children}
                    </th>
                ),

                td: ({ children }) => (
                    <td className="border-b border-white/4 px-2.5 py-1.5 text-zinc-400">
                        {children}
                    </td>
                ),

                code({
                    className,
                    children,
                }) {
                    const match =
                        /language-(\w+)/.exec(
                            className || "",
                        );

                    const code = String(
                        children,
                    ).replace(/\n$/, "");

                    if (!className) {
                        return (
                            <code className="rounded bg-white/10 px-1.5 py-0.5 text-[12.5px] text-sky-300">
                                {code}
                            </code>
                        );
                    }

                    return (
                        <CodeBlock
                            language={match?.[1]}
                            code={code}
                        />
                    );
                },
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;