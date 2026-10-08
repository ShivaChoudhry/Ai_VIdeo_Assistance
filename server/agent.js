import { ChatOllama } from "@langchain/ollama";
import { createAgent } from "langchain";

const llm = new ChatOllama({
    model: "llama3.2:1b",
});

const agent = createAgent({
    model: llm,
    tools: [],
});

const result = await agent.invoke({
    messages: [
        {
            role: "user",
            content: "What is the capital of india?",
        },
    ],
});

console.log(result.messages[result.messages.length - 1].content);