import "dotenv/config";

interface Environment {
    NODE_ENV: "development" | "test" | "production";
    HOST: string;
    PORT: number;
    MONGODB_URL: string;
    FRONTEND_URL: string;
    AUTH_SERVICE_URL: string;
    FILE_SERVICE_URL: string;
    OPENROUTER_API_KEY: string;
}

const getRequiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
};

const getServiceUrl = (key: string): string => {
    const value = getRequiredEnv(key);
    return value.includes("://") ? value : `http://${value}`;
};

const getPort = (): number => {
    const value = process.env.PORT ?? "8004";
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
    MONGODB_URL: getRequiredEnv("MONGODB_URL"),
    FRONTEND_URL: getRequiredEnv("FRONTEND_URL"),
    AUTH_SERVICE_URL: getServiceUrl("AUTH_SERVICE_URL"),
    FILE_SERVICE_URL: getServiceUrl("FILE_SERVICE_URL"),
    OPENROUTER_API_KEY: getRequiredEnv("OPENROUTER_API_KEY"),
};