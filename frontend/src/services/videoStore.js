// Video Store: Client-side video embedding & active video manager
export const DEFAULT_VIDEO = {
  id: '9wXcjnJ2TN8',
  title: '1 Or New Car Aagyi 😍 Porsche',
  url: 'https://www.youtube.com/watch?v=9wXcjnJ2TN8',
  channel: 'Sourav Joshi Vlogs',
  chunksCount: 24,
  dimensions: 768,
  indexedAt: 'Pre-indexed',
};

const STORAGE_ACTIVE_KEY = 'vidiq_active_video';
const STORAGE_VIDEOS_KEY = 'vidiq_videos_list';

export function extractYouTubeId(url = '') {
  if (!url) return null;
  const clean = url.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return clean;
  }

  // Handle formats:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  const patterns = [
    /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/)([\w-]{11})/,
    /[?&]v=([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function getActiveVideo() {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    // Ignore storage errors
  }
  return DEFAULT_VIDEO;
}

export function setActiveVideo(video) {
  try {
    localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(video));
    // Also ensure it is in the list
    addVideo(video);
    // Dispatch custom event so other components update synchronously
    window.dispatchEvent(new Event('active_video_changed'));
  } catch (err) {
    // Ignore
  }
}

export function getVideos() {
  try {
    const saved = localStorage.getItem(STORAGE_VIDEOS_KEY);
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    // Ignore
  }
  return [DEFAULT_VIDEO];
}

export function addVideo(video) {
  try {
    const existing = getVideos();
    const index = existing.findIndex((v) => v.id === video.id);
    let updated;
    if (index >= 0) {
      updated = [video, ...existing.filter((v) => v.id !== video.id)];
    } else {
      updated = [video, ...existing];
    }
    localStorage.setItem(STORAGE_VIDEOS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('videos_list_changed'));
  } catch (err) {
    // Ignore
  }
}
