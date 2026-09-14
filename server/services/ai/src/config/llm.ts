import { ChatOpenRouter } from "@langchain/openrouter";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatCloudflareWorkersAI } from "@langchain/cloudflare";
import { ChatMistralAI } from "@langchain/mistralai";
import { env } from "./env.js";

const llm = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    temperature: 0,
    maxTokens: 1024,
    apiKey: env.OPENROUTER_API_KEY,
});

// const llm = new ChatGoogleGenerativeAI({
//     model: "gemini-3.7-flash",
//     temperature: 0,
//     apiKey: env.GOOGLE_API_KEY,
// });

// const llm = new ChatGroq({
//     model: "openai/gpt-oss-120b",
//     temperature: 0,
//     maxTokens: 1024,
//     maxRetries: 2,
//     apiKey: env.GROQ_API_KEY,
//     // other params...
// })

// const llm = new ChatOpenAI({
//     apiKey: env.DASHSCOPE_API_KEY,
//     model: "qwen3.8-max",
//     configuration: {
//         baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
//     },
// });

// const llm = new ChatOpenAI({
//   model: "@cf/qwen/qwen3.8-27b",
//   apiKey: process.env.CLOUDFLARE_API_TOKEN,
//   configuration: {
//     baseURL: `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
//   },
// });

// const llm = new ChatMistralAI({
//   model: "mistral-small-latest",
//   apiKey: env.MISTRAL_API_KEY,
// });

export default llm;
