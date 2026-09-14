import "dotenv/config";

interface Environment {
    NODE_ENV: "development" | "test" | "production";
    HOST: string;
    PORT: number;
    FILE_SERVICE_URL: string;
}

const getRequiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }

    return value;
};

const getPort = (): number => {
    const value = process.env.PORT ?? "8005";
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
    HOST: process.env.HOST ?? "localhost",
    PORT: getPort(),
    FILE_SERVICE_URL: getRequiredEnv("FILE_SERVICE_URL"),
};