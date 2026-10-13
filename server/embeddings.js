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

export const pool = new Pool({
  connectionString: process.env.DB_URL,
});

export const isVideoIndexed = async (videoId) => {
  try {
    const result = await pool.query(
      `
      SELECT EXISTS (
          SELECT 1
          FROM transcripts
          WHERE metadata->>'video_id' = $1
      ) AS video_exists;
      `,
      [videoId]
    );
    return result.rows[0]?.video_exists || false;
  } catch (error) {
    console.error("Error checking video in DB:", error.message);
    return false;
  }
};

export const getVideoDetailsFromDB = async (videoId) => {
  try {
    const result = await pool.query(
      `
      SELECT metadata->>'title' as title, count(*) as chunks_count
      FROM transcripts
      WHERE metadata->>'video_id' = $1
      GROUP BY metadata->>'title';
      `,
      [videoId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting video details from DB:", error.message);
    return null;
  }
};

export const getAllIndexedVideos = async () => {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT metadata->>'video_id' as video_id,
             metadata->>'title' as title,
             count(*) as chunks_count
      FROM transcripts
      GROUP BY metadata->>'video_id', metadata->>'title'
      ORDER BY chunks_count DESC;
      `
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error getting all indexed videos:", error.message);
    return [];
  }
};

// ============================================
// 3. INITIALIZE PGVECTOR STORE
// ============================================

export const vectorStore = await PGVectorStore.initialize(embeddings, {
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
});

// ============================================
// 4. ADD YOUTUBE TRANSCRIPT
// ============================================

export const addYTVideoToVectoreStore = async (videoData, video_id) => {
  console.log(`\nChecking video: ${video_id}`);

  // Check whether this video already exists.
  const videoExists = await isVideoIndexed(video_id);

  if (videoExists) {
    console.log(`Video ${video_id} already exists. Skipping indexing.`);

    return {
      success: true,
      alreadyExists: true,
      video_id,
      message: "Video is already indexed.",
    };
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

    return {
      success: true,
      alreadyExists: false,
      video_id,
      chunksCount: chunks.length,
      message: "Video indexed successfully.",
    };
  } finally {
    console.timeEnd("Embedding generation + database insertion");
  }
};
