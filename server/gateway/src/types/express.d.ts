declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                name: string;
                email: string;
                avatar: string;
                credits: number;
                plan: "free" | "pro" | "team";
            };
        }
    }
}

export { };