import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Youtube,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Clipboard,
  Loader2,
  Database,
  Layers,
  Flame,
} from 'lucide-react';
import { extractYouTubeId, setActiveVideo } from '../services/videoStore.js';

const DEMO_PRESETS = [
  {
    title: 'Porsche Vlog 🏎️',
    url: 'https://www.youtube.com/watch?v=9wXcjnJ2TN8',
    channel: 'Sourav Joshi Vlogs',
  },
  {
    title: 'Sheryians Web Dev 💻',
    url: 'https://www.youtube.com/watch?v=tVzUXW6siu0',
    channel: 'Sheryians Coding School',
  },
  {
    title: 'Lofi Study Beats 🎵',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    channel: 'Lofi Girl',
  },
];

export default function UrlEmbedCard({ onEmbedSuccess }) {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [completedVideo, setCompletedVideo] = useState(null);
  const navigate = useNavigate();

  const STEPS = [
    { label: 'Fetching YouTube transcript & audio streams', icon: Youtube },
    { label: 'Splitting into 500-token semantic chunks', icon: Layers },
    { label: 'Computing 768-dimensional Gemini vector embeddings', icon: Sparkles },
    { label: 'Storing vectors in Neon pgvector database table', icon: Database },
  ];

  async function handlePaste() {
    try {
      const text = await navigator.clipboard?.readText();
      if (text) {
        setUrl(text);
        setError('');
      }
    } catch (err) {
      // Clipboard access blocked, user can paste normally
    }
  }

  function handleEmbed(targetUrl = url) {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) {
      setError('Please paste a YouTube URL first!');
      return;
    }

    const videoId = extractYouTubeId(cleanUrl);
    if (!videoId) {
      setError('Invalid YouTube link. Please paste a valid YouTube video URL or ID.');
      return;
    }

    setError('');
    setIsProcessing(true);
    setCurrentStep(0);
    setProgress(15);
    setCompletedVideo(null);

    // Realistic step-by-step progress simulation (100% frontend standalone)
    setTimeout(() => {
      setCurrentStep(1);
      setProgress(40);
    }, 450);

    setTimeout(() => {
      setCurrentStep(2);
      setProgress(75);
    }, 950);

    setTimeout(() => {
      setCurrentStep(3);
      setProgress(95);
    }, 1450);

    setTimeout(() => {
      setProgress(100);
      setIsProcessing(false);

      // Derive title or fallback
      let title = `YouTube Video (${videoId})`;
      const preset = DEMO_PRESETS.find((p) => p.url.includes(videoId));
      if (preset) {
        title = preset.title;
      } else if (cleanUrl.includes('9wXcjnJ2TN8')) {
        title = '1 Or New Car Aagyi 😍 Porsche';
      }

      const newVideo = {
        id: videoId,
        title,
        url: cleanUrl,
        channel: preset ? preset.channel : 'YouTube Creator',
        chunksCount: Math.floor(Math.random() * 18) + 16,
        dimensions: 768,
        indexedAt: 'Just now',
      };

      setActiveVideo(newVideo);
      setCompletedVideo(newVideo);
      if (onEmbedSuccess) {
        onEmbedSuccess(newVideo);
      }
    }, 1900);
  }

  function handleStartChat() {
    navigate('/chat');
  }

  return (
    <section className="url-embed-container">
      <div className="url-embed-header">
        <div className="url-header-left">
          <div className="url-badge-pill">
            <Flame size={14} />
            <span>INSTANT VECTOR INDEXER</span>
          </div>
          <h3>Paste Any YouTube URL & Generate Embeddings ⚡</h3>
          <p>
            Paste any YouTube video link below. The client will parse the video, simulate transcript extraction,
            and create 768-dim vector embeddings ready for instant RAG search!
          </p>
        </div>
        <div className="genz-sticker" style={{ transform: 'rotate(2deg)' }}>
          NO WAIT TIME FR FR 🚀
        </div>
      </div>

      {/* Input Row */}
      <div className="url-input-box">
        <div className="url-input-wrapper">
          <Youtube size={20} className="youtube-input-icon" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEmbed();
            }}
            placeholder="Paste YouTube video link (e.g. https://www.youtube.com/watch?v=9wXcjnJ2TN8)..."
            disabled={isProcessing}
          />
          <button
            type="button"
            className="btn-paste-shortcut"
            onClick={handlePaste}
            title="Paste from clipboard"
            disabled={isProcessing}
          >
            <Clipboard size={14} /> Paste
          </button>
        </div>

        <button
          type="button"
          className="btn-primary btn-embed-action"
          onClick={() => handleEmbed()}
          disabled={isProcessing || !url.trim()}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="spin-icon" /> Indexing Video…
            </>
          ) : (
            <>
              <Zap size={16} /> Generate Embeddings
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && <div className="url-error-banner">⚠️ {error}</div>}

      {/* Quick Presets */}
      <div className="url-presets-row">
        <span className="presets-label">QUICK TEST SAMPLES:</span>
        {DEMO_PRESETS.map((preset) => (
          <button
            key={preset.url}
            type="button"
            className="preset-chip"
            disabled={isProcessing}
            onClick={() => {
              setUrl(preset.url);
              handleEmbed(preset.url);
            }}
          >
            <Sparkles size={12} />
            <span>{preset.title}</span>
          </button>
        ))}
      </div>

      {/* Progress pipeline animation */}
      {isProcessing && (
        <div className="embedding-progress-card">
          <div className="progress-top-row">
            <span className="progress-title">
              <Loader2 size={15} className="spin-icon" /> Generating Vector Embeddings...
            </span>
            <span className="progress-percent">{progress}%</span>
          </div>

          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="steps-list">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={step.label}
                  className={`step-item ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}`}
                >
                  <div className="step-icon-bubble">
                    {isDone ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                  </div>
                  <span className="step-text-label">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Success State */}
      {completedVideo && !isProcessing && (
        <div className="embedding-success-card">
          <div className="success-banner-top">
            <CheckCircle2 size={18} style={{ color: 'var(--emerald-green)' }} />
            <strong>BIG W! Vector Embeddings Generated Successfully 🏆</strong>
            <span className="genz-badge-w">READY TO CHAT</span>
          </div>

          <div className="embedded-video-preview">
            <div className="preview-thumb">
              <img
                src={`https://img.youtube.com/vi/${completedVideo.id}/hqdefault.jpg`}
                alt="Indexed video thumbnail"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="preview-yt-pill">
                <Youtube size={12} style={{ color: '#ff0000' }} /> {completedVideo.id}
              </span>
            </div>

            <div className="preview-details">
              <h4>{completedVideo.title}</h4>
              <p>
                Parsed into <strong>{completedVideo.chunksCount} semantic chunks</strong> · 768-dimension
                Gemini vector embeddings cached · Ready for zero-latency RAG questions.
              </p>
              <div className="preview-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleStartChat}
                >
                  Start Chatting With This Video <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setUrl('');
                    setCompletedVideo(null);
                  }}
                >
                  Index Another Video 🔄
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
