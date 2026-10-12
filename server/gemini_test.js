
import { ChatGroq } from "@langchain/groq";
import "dotenv/config";

import "dotenv/config";

console.log(
    "API Key Loaded:",
    Boolean(process.env.GROQ_API_KEY)
);
const llm = new ChatGroq({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
});
const response = await llm.invoke(
    "Explain RAG in three simple points."
);

console.log(response.content);