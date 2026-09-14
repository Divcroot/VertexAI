export const getLanguageFromExtension = (extension: string): string => {
    const languages: Record<string, string> = {
        js: "javascript",
        jsx: "javascript",
        mjs: "javascript",
        cjs: "javascript",

        ts: "typescript",
        tsx: "typescript",

        json: "json",
        css: "css",
        html: "html",

        py: "python",

        yml: "yaml",
        yaml: "yaml",

        md: "markdown",

        sql: "sql",
        xml: "xml",
        sh: "shell",
        bash: "shell",
    };

    return languages[extension.toLowerCase()] ?? "plaintext";
};