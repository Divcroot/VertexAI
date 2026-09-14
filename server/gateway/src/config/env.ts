import "dotenv/config";

interface Environment {
    NODE_ENV: "development" | "test" | "production";
    HOST: string;
    PORT: number;
    CORS_ORIGIN: string;

    AUTH_SERVICE_URL: string;
    PROJECT_SERVICE_URL: string;
    FILE_SERVICE_URL: string;
    AI_SERVICE_URL: string;
    TERMINAL_SERVICE_URL: string;
    PAYMENT_SERVICE_URL: string;
}

const getRequiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
};

const getPort = (): number => {
    const value = process.env.PORT ?? "8000";
    const port = Number(value);

    if (!Number.isInteger(port) || port <= 0) {
        throw new Error(`Invalid PORT value: ${value}`);
    }

    return port;
};

const getNodeEnvironment = (): Environment["NODE_ENV"] => {
    const value = process.env.NODE_ENV ?? "development";

    if (!["development", "test", "production"].includes(value)) {
        throw new Error(`Invalid NODE_ENV value: ${value}`);
    }

    return value as Environment["NODE_ENV"];
};

export const env: Environment = {
    NODE_ENV: getNodeEnvironment(),
    HOST: process.env.HOST ?? "0.0.0.0",
    PORT: getPort(),
    CORS_ORIGIN: getRequiredEnv("CORS_ORIGIN"),

    AUTH_SERVICE_URL: getRequiredEnv("AUTH_SERVICE_URL"),
    PROJECT_SERVICE_URL: getRequiredEnv("PROJECT_SERVICE_URL"),
    FILE_SERVICE_URL: getRequiredEnv("FILE_SERVICE_URL"),
    AI_SERVICE_URL: getRequiredEnv("AI_SERVICE_URL"),
    TERMINAL_SERVICE_URL: getRequiredEnv("TERMINAL_SERVICE_URL"),
    PAYMENT_SERVICE_URL: getRequiredEnv("PAYMENT_SERVICE_URL"),
};