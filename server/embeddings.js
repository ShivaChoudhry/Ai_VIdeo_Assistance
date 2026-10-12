import "dotenv/config";

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import pg from "pg";

const { Pool } = pg;

// ============================================
// 1. EMBEDDING MODEL
// ============================================

const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "gemini-embedding-001",
    outputDimensionality: 768,
});

// ============================================
// 2. DATABASE CONNECTION
// ============================================

const pool = new Pool({
    connectionString: process.env.DB_URL,
});

// ============================================
// 3. INITIALIZE PGVECTOR STORE
// ============================================

export const vectorStore = await PGVectorStore.initialize(
    embeddings,
    {
        postgresConnectionOptions: {
            connectionString: process.env.DB_URL,
        },

        tableName: "transcripts",

        columns: {
            idColumnName: "id",
            vectorColumnName: "vector",
            contentColumnName: "content",
            metadataColumnName: "metadata",
        },

        distanceStrategy: "cosine",
    }
);

// ============================================
// 4. ADD YOUTUBE TRANSCRIPT
// ============================================

export const addYTVideoToVectoreStore = async (
    videoData,
    video_id
) => {
    console.log(`\nChecking video: ${video_id}`);

    // Check whether this video already exists.
    const result = await pool.query(
        `
        SELECT EXISTS (
            SELECT 1
            FROM transcripts
            WHERE metadata->>'video_id' = $1
        ) AS video_exists;
        `,
        [video_id]
    );

    const videoExists = result.rows[0].video_exists;

    if (videoExists) {
        console.log(
            `Video ${video_id} already exists. Skipping indexing.`
        );

        return;
    }

    console.log("New video detected. Starting indexing...");

    // ============================================
    // 5. CREATE DOCUMENT
    // ============================================

    const docs = [
        new Document({
            pageContent: videoData.transcript,

            metadata: {
                title: videoData.title,
                video_id: video_id,
            },
        }),
    ];

    // ============================================
    // 6. SPLIT TRANSCRIPT
    // ============================================

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const chunks = await splitter.splitDocuments(docs);

    console.log(`Total chunks: ${chunks.length}`);

    // ============================================
    // 7. GENERATE EMBEDDINGS AND STORE
    // ============================================

    console.time("Embedding generation + database insertion");

    try {
        await vectorStore.addDocuments(chunks);

        console.log(`Video ${video_id} added successfully.`);
    } finally {
        console.timeEnd("Embedding generation + database insertion");
    }
};

