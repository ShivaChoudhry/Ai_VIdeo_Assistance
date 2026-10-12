import "dotenv/config";

import data from "./data.js";
import { addYTVideoToVectoreStore } from "./embeddings.js";

const videoId = "9wXcjnJ2TN8";

async function ingestVideo() {
    try {
        // Find the video in data.js
        const video = data.find(
            (item) => item.video_id === videoId
        );

        if (!video) {
            throw new Error(
                `Video ${videoId} not found in data.js`
            );
        }

        if (!video.transcript) {
            throw new Error("Video transcript is missing.");
        }

        console.log("Video found:", video.title);
        console.log("Video ID:", video.video_id);
        console.log(
            "Transcript length:",
            video.transcript.length
        );

        // Generate Gemini embeddings and save to Neon
        await addYTVideoToVectoreStore(
            {
                title: video.title,
                transcript: video.transcript,
            },
            video.video_id
        );

        console.log("\nIngestion process completed.");
        process.exit(0);

    } catch (error) {
        console.error("\nIngestion failed:", error.message);
        process.exit(1);
    }
}

ingestVideo();