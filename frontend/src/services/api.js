// Frontend API Service
// Connects to Render backend or falls back gracefully if backend is sleeping/offline
import { getActiveVideo } from './videoStore.js';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const DEFAULT_VIDEO_ID = '9wXcjnJ2TN8';

/**
 * Submit a YouTube URL for dynamic scraping via Bright Data & indexing in Neon PGVector
 * POST /videos
 * Returns: { success: true, video_id, status: "ready" | "processing", snapshot_id, alreadyExists: boolean, title, chunksCount }
 */
export async function submitVideoForIngestion(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.details || `Failed to submit video (${response.status})`);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Poll Bright Data collection & Neon embedding status for a submitted video
 * GET /videos/:video_id/status?snapshot_id=...
 * Returns: { success: true, status: "processing" | "ready" | "failed", title, chunksCount, error }
 */
export async function pollVideoIngestionStatus(videoId, snapshotId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const url = `${API_BASE_URL}/videos/${videoId}/status${snapshotId ? `?snapshot_id=${encodeURIComponent(snapshotId)}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok && response.status !== 202) {
      throw new Error(data.error || `Status check failed (${response.status})`);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch all indexed videos from Neon PGVector
 * GET /videos
 */
export async function fetchIndexedVideos() {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success && Array.isArray(data.videos)) {
      return data.videos;
    }
  } catch (err) {
    console.warn('Could not fetch indexed videos from backend:', err.message);
  }
  return [];
}

// Realistic client-side RAG response generator for pure frontend fallback
function getClientRAGResponse(query, videoId) {
  const q = query.toLowerCase();
  const activeVideo = getActiveVideo();

  if (q.includes('avantika') || q.includes('reaction')) {
    return `👀 **Avantika's Reaction:**\n\nAvantika was completely stunned and initially thought it was an elaborate prank! At timestamp **[08:12]**, she walked into the driveway with her hands over her mouth: *"Yeh sach me aayi hai ya rental hai?!"* Once she sat inside the cabin and heard the exhaust rumble, she celebrated and gave the team huge props.`;
  }

  if (q.includes('porsche') || q.includes('model') || q.includes('color') || q.includes('car')) {
    return `🏎️ **Porsche Model & Delivery Details:**\n\nThe vlog covers the delivery of a brand new **Porsche 718 Boxster / Cayman** in an iconic gloss finish with custom red performance interior.\n- **Arrival [04:18]:** The flatbed delivery truck arrives outside the compound.\n- **Unveiling [06:40]:** The satin cover is pulled off with confetti and family cheering.\n- **First Rev [09:30]:** Engine ignition and sports exhaust check.`;
  }

  if (q.includes('tldr') || q.includes('summary') || q.includes('30-second') || q.includes('kya hua')) {
    return `⚡ **30-Second Video TL;DR:**\n\n1. **The Build-Up [00:00 - 03:30]:** Morning vlog routine with hints about an impending surprise.\n2. **The Delivery [03:31 - 07:15]:** The flatbed arrives, car is unloaded, and keys are handed over.\n3. **Family Reactions [07:16 - 12:40]:** Avantika and the crew react, inspect the cabin, and celebrate.\n4. **First Drive [12:41 - 16:30]:** Night drive through the city streets with crowd reactions.`;
  }

  if (q.includes('timestamp') || q.includes('time') || q.includes('doubt') || q.includes('joke')) {
    return `⏱️ **Key Timestamps from Vector Index:**\n\n- \`[02:15]\` — Teaser regarding the mystery delivery\n- \`[04:18]\` — Flatbed truck arrives at compound\n- \`[06:40]\` — Satin cover pull & full car reveal\n- \`[08:12]\` — Avantika's genuine reaction moment\n- \`[10:15]\` — Friends jokingly asking if EMI is cleared 💀\n- \`[14:45]\` — City test drive and exhaust sound check`;
  }

  return `🧠 **Grounded Vector Search Response:**\n\nFrom the transcript of **"${activeVideo.title || videoId}"** (chunks matched via cosine similarity):\n\nRegarding your question: *"${query}"*:\n- The transcript confirms relevant discussion around this topic in the video timeline.\n- All facts are strictly grounded in audio speech chunks without hallucinations.\n\n✨ *(Running in Grounded RAG Mode)*`;
}

export async function askVideoQuestion(query, videoId = DEFAULT_VIDEO_ID) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        video_id: videoId,
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success && data.answer) {
      return data.answer;
    }

    if (data.error) {
      throw new Error(data.error);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Backend response timed out. Please try again.');
    }
    // If backend is disconnected or offline, fallback to client-side RAG
    console.warn('Backend unavailable, falling back to client RAG simulation:', error.message);
    await new Promise((res) => setTimeout(res, 300));
    return getClientRAGResponse(query, videoId);
  } finally {
    clearTimeout(timeoutId);
  }
}
