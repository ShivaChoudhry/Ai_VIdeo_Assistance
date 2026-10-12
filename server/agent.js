import "dotenv/config";

import { ChatGroq } from "@langchain/groq";
import { vectorStore } from "./embeddings.js";

// ============================================
// 1. DEFAULT VIDEO CONFIGURATION
// ============================================

const defaultVideoId = "9wXcjnJ2TN8";


// ============================================
// 2. LLM CONFIGURATION
// ============================================

const llm = new ChatGroq({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    apiKey: process.env.GROQ_API_KEY,
});


// ============================================
// 3. RETRIEVE RELEVANT TRANSCRIPT
// ============================================

async function retrieveTranscript(query, videoId) {

    console.log("\nSearching transcript...");
    console.log("Query:", query);
    console.log("Video ID:", videoId);

    const retrievedDocs = await vectorStore.similaritySearch(
        query,
        8,
        {
            video_id: videoId,
        }
    );

    console.log(
        "Retrieved document count:",
        retrievedDocs.length
    );

    retrievedDocs.forEach((doc, index) => {

        console.log(`\nDocument ${index + 1}:`);

        console.log("Metadata:", doc.metadata);

        console.log("Content:", doc.pageContent);

    });

    if (retrievedDocs.length === 0) {
        return [];
    }

    return retrievedDocs;
}


// ============================================
// 4. SYSTEM PROMPT
// ============================================

const systemPrompt = `
You are a question-answering assistant for YouTube video transcripts.

RULES:

1. Answer using only the supplied transcript context.
2. Do not ask the user for the video title or link.
3. The video has already been selected by the application.
4. Understand Hindi, Hinglish, and English transcript content.
5. Answer the specific question asked by the user.
6. Do not invent names, facts, events, or details.
7. If the context does not contain sufficient evidence, say:
   "I could not find this information in the video."
8. Return the answer in plain text.
9. Do not return JSON or tool-call arguments.
10. Keep the answer concise and relevant.
`;


// ============================================
// 5. REUSABLE FUNCTION FOR EXPRESS API
// ============================================

export async function answerQuestion(query, video_id) {

    if (!query || typeof query !== "string") {

        throw new Error("A valid query is required.");

    }

    const selectedVideoId = video_id || defaultVideoId;


    console.log("\n================================");

    console.log("Question:", query);

    console.log("Video ID:", selectedVideoId);

    console.log("================================");


    // ========================================
    // STEP 1: RETRIEVE TRANSCRIPT
    // ========================================

    const retrievedDocs = await retrieveTranscript(
        query,
        selectedVideoId
    );


    // ========================================
    // STEP 2: HANDLE EMPTY RETRIEVAL
    // ========================================

    if (retrievedDocs.length === 0) {

        return "I could not find this information in the video.";

    }


    // ========================================
    // STEP 3: BUILD CONTEXT
    // ========================================

    const context = retrievedDocs
        .map((doc, index) => {
            return `Transcript chunk ${index + 1}:\n${doc.pageContent}`;
        })
        .join("\n\n");


    // ========================================
    // STEP 4: GENERATE ANSWER
    // ========================================

    console.log("\nGenerating answer with Qwen3:8B...");

    const response = await llm.invoke([
        {
            role: "system",
            content: systemPrompt,
        },
        {
            role: "user",
            content: `
VIDEO TRANSCRIPT CONTEXT:

${context}

USER QUESTION:

${query}

Answer the user's question using the transcript context above.
Do not ask for the video title or link.
`,
        },
    ]);


    // ========================================
    // STEP 5: RETURN FINAL ANSWER
    // ========================================

    console.log("\nGenerated answer:");

    console.log(response.content);

    return response.content;

}