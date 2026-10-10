import "dotenv/config";
import { ChatOllama } from "@langchain/ollama";
import data from "./data.js"
import { createAgent } from "langchain";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";


const video1=data[0];

const docs=[new Document({
    pageContent: video1.transcript,
    metadata: { title: video1.title },
})];

//Splitting the text into chunks
const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);

console.log(chunks);

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



