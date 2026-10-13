// Video Store: Active video and indexed video manager

export const DEFAULT_VIDEO = {
    id: "9wXcjnJ2TN8",
    title: "1 Or New Car Aagyi 😍 Porsche",
    url: "https://www.youtube.com/watch?v=9wXcjnJ2TN8",
    channel: "Sourav Joshi Vlogs",
    chunksCount: 24,
    dimensions: 768,
    indexedAt: "Pre-indexed",
    status: "ready",
};

const STORAGE_ACTIVE_KEY = "vidiq_active_video";
const STORAGE_VIDEOS_KEY = "vidiq_videos_list";

// Extract ID from YouTube URL or accept an 11-character ID.
export function extractYouTubeId(input = "") {
    if (typeof input !== "string") return null;

    const clean = input.trim();

    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
        return clean;
    }

    try {
        const parsed = new URL(clean);
        const host = parsed.hostname.toLowerCase();
        let videoId = null;

        if (host === "youtu.be") {
            videoId = parsed.pathname.split("/").filter(Boolean)[0];
        } else if (
            [
                "youtube.com",
                "www.youtube.com",
                "m.youtube.com",
                "music.youtube.com",
            ].includes(host)
        ) {
            if (parsed.pathname === "/watch") {
                videoId = parsed.searchParams.get("v");
            } else {
                const match = parsed.pathname.match(
                    /^\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})(?:\/|$)/
                );

                if (match) videoId = match[1];
            }
        }

        return videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)
            ? videoId
            : null;
    } catch {
        return null;
    }
}

function dispatchStoreEvent(eventName) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(eventName));
    }
}

export function getActiveVideo() {
    try {
        const saved = localStorage.getItem(STORAGE_ACTIVE_KEY);

        if (saved) {
            const video = JSON.parse(saved);

            if (video && video.id) return video;
        }
    } catch {
        // Ignore invalid or unavailable localStorage.
    }

    return DEFAULT_VIDEO;
}

export function setActiveVideo(video) {
    if (!video || !video.id) {
        throw new Error("A valid video with an ID is required.");
    }

    try {
        localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(video));
        addVideo(video);
        dispatchStoreEvent("active_video_changed");
    } catch (error) {
        console.error("Failed to save active video:", error);
        throw error;
    }
}

export function getVideos() {
    try {
        const saved = localStorage.getItem(STORAGE_VIDEOS_KEY);

        if (saved) {
            const videos = JSON.parse(saved);

            if (Array.isArray(videos)) {
                const uniqueVideos = videos.filter(
                    (video, index, list) =>
                        video?.id &&
                        list.findIndex((item) => item.id === video.id) === index
                );

                return uniqueVideos;
            }
        }
    } catch {
        // Ignore invalid or unavailable localStorage.
    }

    return [DEFAULT_VIDEO];
}

export function addVideo(video) {
    if (!video || !video.id) {
        throw new Error("A valid video with an ID is required.");
    }

    try {
        const existing = getVideos();

        const updated = [
            video,
            ...existing.filter((item) => item.id !== video.id),
        ];

        localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(updated));
        dispatchStoreEvent("videos_list_changed");
    } catch (error) {
        console.error("Failed to save video:", error);
        throw error;
    }
}

export function updateVideoStatus(videoId, status, extra = {}) {
    if (!videoId) return;

    const existing = getVideos();
    const current = existing.find((video) => video.id === videoId);

    const updatedVideo = {
        ...(current || {
            id: videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            title: `YouTube Video (${videoId})`,
            channel: "YouTube Creator",
        }),
        ...extra,
        status,
    };

    addVideo(updatedVideo);

    const activeVideo = getActiveVideo();

    if (activeVideo.id === videoId) {
        setActiveVideo(updatedVideo);
    }
}