import { ChatOpenRouter } from "@langchain/openrouter";
import { env } from "./env.js";

const llm = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    temperature: 0,
    maxTokens: 1024,
    apiKey: env.OPENROUTER_API_KEY,
});

export default llm;
