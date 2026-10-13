import "dotenv/config";
import express from "express";
import cors from "cors";
import axios from "axios";

import { answerQuestion } from "./agent.js";
import {
    addYTVideoToVectoreStore,
    isVideoIndexed,
    getVideoDetailsFromDB,
    getAllIndexedVideos
} from "./embeddings.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 3000;
const DATASET_ID = process.env.BRIGHT_DATA_DATASET_ID || "gd_lk56epmy2i5g7lzu0k";

const BRIGHT_DATA_BASE_URL =
    "https://api.brightdata.com/datasets/v3";

// Temporary job tracking (fallback cache).
const jobs = new Map();

// Prevent the same snapshot from being indexed concurrently.
const processingJobs = new Map();

// ============================================
// HELPERS
// ============================================

function extractYouTubeVideoId(input) {
    if (!input || typeof input !== "string") return null;
    const clean = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
        return clean;
    }

    try {
        const url = new URL(clean);
        const hostname = url.hostname.toLowerCase();

        let videoId = null;

        if (hostname === "youtu.be") {
            videoId = url.pathname.split("/").filter(Boolean)[0];
        } else if (
            [
                "youtube.com",
                "www.youtube.com",
                "m.youtube.com",
                "music.youtube.com"
            ].includes(hostname)
        ) {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v");
            } else {
                const match = url.pathname.match(
                    /^\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/
                );

                if (match) {
                    videoId = match[1];
                }
            }
        }

        return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)
            ? videoId
            : null;
    } catch {
        return null;
    }
}

function getBrightDataHeaders() {
    const key = process.env.BRIGHT_DATA_API_KEY || process.env.BRIGHTDATA_API_KEY;
    if (!key) {
        throw new Error(
            "BRIGHT_DATA_API_KEY is not configured in server environment variables"
        );
    }

    return {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
    };
}

function extractTranscript(record) {
    if (typeof record.transcript === "string" && record.transcript.trim()) {
        return record.transcript.trim();
    }

    if (Array.isArray(record.formatted_transcript)) {
        return record.formatted_transcript
            .map((segment) => segment?.text || "")
            .filter(Boolean)
            .join("\n")
            .trim();
    }

    return "";
}

// ============================================
// HEALTH CHECK
// ============================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "VidiQ AI backend is running"
    });
});

// ============================================
// GET ALL INDEXED VIDEOS FROM DATABASE
// GET /videos
// ============================================

app.get("/videos", async (req, res) => {
    try {
        const videos = await getAllIndexedVideos();
        return res.json({
            success: true,
            videos
        });
    } catch (error) {
        console.error("Error fetching indexed videos:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch indexed videos"
        });
    }
});

// ============================================
// SUBMIT YOUTUBE VIDEO FOR PROCESSING
// POST /videos
// Body: { "url": "https://www.youtube.com/watch?v=..." }
// ============================================

app.post("/videos", async (req, res) => {
    try {
        const { url } = req.body;

        if (!url || typeof url !== "string") {
            return res.status(400).json({
                success: false,
                error: "YouTube URL is required"
            });
        }

        const video_id = extractYouTubeVideoId(url);

        if (!video_id) {
            return res.status(400).json({
                success: false,
                error: "Invalid YouTube URL or Video ID"
            });
        }

        // 1. Instant check: Is this video already in Neon PGVector?
        const alreadyIndexed = await isVideoIndexed(video_id);
        if (alreadyIndexed) {
            console.log(`Video ${video_id} already indexed in Neon DB.`);
            const details = await getVideoDetailsFromDB(video_id);
            return res.json({
                success: true,
                video_id,
                status: "ready",
                alreadyExists: true,
                title: details?.title || "YouTube Video",
                chunksCount: parseInt(details?.chunks_count, 10) || 24,
                message: "Video is already indexed in Neon PGVector. Ready to chat!"
            });
        }

        const headers = getBrightDataHeaders();
        console.log("Triggering Bright Data scraper for video:", video_id);

        const targetUrl = `https://www.youtube.com/watch?v=${video_id}`;
        let response;

        try {
            // Format 1: Direct JSON array
            response = await axios.post(
                `${BRIGHT_DATA_BASE_URL}/trigger?dataset_id=${DATASET_ID}&include_errors=true&format=json`,
                [
                    {
                        url: targetUrl
                    }
                ],
                {
                    headers,
                    timeout: 30000
                }
            );
        } catch (firstErr) {
            console.log(
                "Array trigger attempt failed, trying { input: [...] } format:",
                firstErr.response?.data || firstErr.message
            );

            // Format 2: Object with input array
            response = await axios.post(
                `${BRIGHT_DATA_BASE_URL}/trigger?dataset_id=${DATASET_ID}&include_errors=true&format=json`,
                {
                    input: [
                        {
                            url: targetUrl
                        }
                    ]
                },
                {
                    headers,
                    timeout: 30000
                }
            );
        }

        const snapshot_id = response.data?.snapshot_id;

        if (!snapshot_id) {
            console.error(
                "Bright Data did not return a snapshot ID:",
                response.data
            );

            return res.status(502).json({
                success: false,
                error: "Bright Data did not return a snapshot ID"
            });
        }

        jobs.set(snapshot_id, {
            snapshot_id,
            video_id,
            status: "processing",
            title: null,
            chunksCount: null,
            error: null,
            createdAt: new Date().toISOString()
        });

        console.log(
            "Bright Data collection started:",
            video_id,
            snapshot_id
        );

        return res.status(202).json({
            success: true,
            video_id,
            snapshot_id,
            status: "processing",
            message: "Video collection started via Bright Data"
        });
    } catch (error) {
        console.error(
            "Video submission failed:",
            error.response?.data || error.message
        );

        const statusCode = error.response?.status || 500;

        return res.status(
            statusCode >= 400 && statusCode < 500
                ? statusCode
                : 500
        ).json({
            success: false,
            error: "Failed to start video collection",
            details: error.response?.data?.message || error.message
        });
    }
});

// ============================================
// CHECK VIDEO PROCESSING STATUS
// GET /videos/:video_id/status?snapshot_id=...
//
// When Bright Data is ready:
// 1. Download snapshot
// 2. Extract transcript
// 3. Index transcript in Neon/pgvector
// 4. Return ready status
// ============================================

app.get("/videos/:video_id/status", async (req, res) => {
    const { video_id } = req.params;
    const { snapshot_id } = req.query;

    if (!/^[a-zA-Z0-9_-]{11}$/.test(video_id)) {
        return res.status(400).json({
            success: false,
            error: "Invalid video ID"
        });
    }

    if (!snapshot_id || typeof snapshot_id !== "string") {
        return res.status(400).json({
            success: false,
            error: "snapshot_id is required"
        });
    }

    // 1. Database check: If already indexed, return ready immediately!
    const alreadyIndexed = await isVideoIndexed(video_id);
    if (alreadyIndexed) {
        const details = await getVideoDetailsFromDB(video_id);
        return res.json({
            success: true,
            video_id,
            snapshot_id,
            status: "ready",
            title: details?.title || "YouTube Video",
            chunksCount: parseInt(details?.chunks_count, 10) || 24
        });
    }

    let job = jobs.get(snapshot_id);

    // If server restarted and in-memory job was lost, reconstruct it
    if (!job) {
        job = {
            snapshot_id,
            video_id,
            status: "processing",
            title: null,
            chunksCount: null,
            error: null,
            createdAt: new Date().toISOString()
        };
        jobs.set(snapshot_id, job);
    }

    if (job.status === "ready") {
        return res.json({
            success: true,
            video_id,
            snapshot_id,
            status: "ready",
            title: job.title,
            chunksCount: job.chunksCount
        });
    }

    if (job.status === "failed") {
        return res.status(422).json({
            success: false,
            video_id,
            snapshot_id,
            status: "failed",
            error: job.error || "Video processing failed"
        });
    }

    // If another status request is already processing this snapshot,
    // wait for that same operation instead of indexing twice.
    if (processingJobs.has(snapshot_id)) {
        try {
            await processingJobs.get(snapshot_id);
        } catch {
            // The job state below contains the error.
        }

        const updatedJob = jobs.get(snapshot_id);

        if (updatedJob?.status === "ready") {
            return res.json({
                success: true,
                video_id,
                snapshot_id,
                status: "ready",
                title: updatedJob.title,
                chunksCount: updatedJob.chunksCount
            });
        }

        if (updatedJob?.status === "failed") {
            return res.status(422).json({
                success: false,
                video_id,
                snapshot_id,
                status: "failed",
                error: updatedJob.error
            });
        }

        return res.json({
            success: true,
            video_id,
            snapshot_id,
            status: "processing"
        });
    }

    const processSnapshot = async () => {
        try {
            const headers = getBrightDataHeaders();

            // Check collection progress.
            const progressResponse = await axios.get(
                `${BRIGHT_DATA_BASE_URL}/progress/${snapshot_id}`,
                {
                    headers,
                    timeout: 20000
                }
            );

            const brightDataStatus = progressResponse.data?.status;

            console.log(
                "Bright Data status:",
                video_id,
                brightDataStatus
            );

            if (brightDataStatus === "failed") {
                job.status = "failed";
                job.error = "Bright Data collection failed";
                return;
            }

            if (brightDataStatus !== "ready") {
                job.status = "processing";
                return;
            }

            // Download collected records.
            const snapshotResponse = await axios.get(
                `${BRIGHT_DATA_BASE_URL}/snapshot/${snapshot_id}`,
                {
                    params: {
                        format: "json"
                    },
                    headers,
                    timeout: 60000
                }
            );

            const payload = snapshotResponse.data;

            const records = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.data)
                    ? payload.data
                    : [];

            if (records.length === 0) {
                job.status = "failed";
                job.error = "Bright Data returned no video records";
                return;
            }

            // Select the record belonging to the requested video.
            const record = records.find((item) => {
                const recordVideoId =
                    item.video_id ||
                    extractYouTubeVideoId(item.url || "");

                return recordVideoId === video_id;
            });

            if (!record) {
                job.status = "failed";
                job.error =
                    "The requested video was not found in the snapshot";
                return;
            }

            const transcript = extractTranscript(record);

            if (!transcript) {
                job.status = "failed";
                job.error =
                    "No transcript was returned for this video";
                return;
            }

            const videoData = {
                video_id,
                title: record.title || "YouTube Video",
                transcript
            };

            console.log("Indexing transcript:", video_id);

            // Generate embeddings and store transcript chunks.
            const indexingResult = await addYTVideoToVectoreStore(
                videoData,
                video_id
            );

            job.status = "ready";
            job.title = videoData.title;
            job.chunksCount = indexingResult.chunksCount ?? null;
            job.error = null;
            job.completedAt = new Date().toISOString();

            console.log("Video is ready:", video_id);
        } catch (error) {
            console.error(
                "Video processing failed:",
                error.response?.data || error.message
            );

            job.status = "failed";
            job.error =
                error.response?.data?.message ||
                error.message ||
                "Video processing failed";
        }
    };

    const processingPromise = processSnapshot();

    processingJobs.set(snapshot_id, processingPromise);

    try {
        await processingPromise;
    } finally {
        processingJobs.delete(snapshot_id);
    }

    if (job.status === "failed") {
        return res.status(422).json({
            success: false,
            video_id,
            snapshot_id,
            status: "failed",
            error: job.error
        });
    }

    return res.json({
        success: true,
        video_id,
        snapshot_id,
        status: job.status,
        title: job.title,
        chunksCount: job.chunksCount
    });
});

// ============================================
// BRIGHT DATA WEBHOOK ENDPOINT (OPTIONAL DELIVERY)
// POST /webhook/brightdata
// ============================================

app.get("/webhook/brightdata", (req, res) => {
    res.json({
        success: true,
        message: "Bright Data webhook endpoint is live and ready"
    });
});

app.post("/webhook/brightdata", async (req, res) => {
    try {
        console.log("Received Bright Data webhook push");
        const payload = req.body;

        const records = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
                ? payload.data
                : payload && typeof payload === "object"
                    ? [payload]
                    : [];

        if (records.length === 0) {
            return res.json({ success: true, message: "Webhook received (no records)" });
        }

        for (const record of records) {
            const video_id =
                record.video_id ||
                extractYouTubeVideoId(record.url || "");

            if (!video_id) continue;

            const transcript = extractTranscript(record);
            if (!transcript) {
                console.warn(`No transcript in webhook record for video ${video_id}`);
                continue;
            }

            const videoData = {
                video_id,
                title: record.title || "YouTube Video",
                transcript
            };

            await addYTVideoToVectoreStore(videoData, video_id);
            console.log(`Video ${video_id} indexed via webhook!`);
        }

        return res.json({
            success: true,
            message: "Webhook processed and video indexed"
        });
    } catch (error) {
        console.error("Webhook processing error:", error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// GENERATE RAG ANSWER
// POST /generate
// Body: { "query": "...", "video_id": "..." }
// ============================================

app.post("/generate", async (req, res) => {
    try {
        const { query, video_id } = req.body;

        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                error: "Query is required"
            });
        }

        if (
            video_id &&
            !/^[a-zA-Z0-9_-]{11}$/.test(video_id)
        ) {
            return res.status(400).json({
                success: false,
                error: "Invalid video ID"
            });
        }

        console.log(
            "Question received:",
            query,
            "Video:",
            video_id || "default"
        );

        const answer = await answerQuestion(query.trim(), video_id);

        return res.json({
            success: true,
            answer
        });
    } catch (error) {
        console.error(
            "Answer generation failed:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error: "Failed to generate answer"
        });
    }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`VidiQ AI server running on port ${PORT}`);
});