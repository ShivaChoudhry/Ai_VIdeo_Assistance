import React, { useState, useRef, useEffect } from 'react';
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
import { submitVideoForIngestion, pollVideoIngestionStatus } from '../services/api.js';

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
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [completedVideo, setCompletedVideo] = useState(null);
  const pollingRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const STEPS = [
    { label: 'Scraping video transcript via Bright Data API', icon: Youtube },
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
      // Clipboard access blocked
    }
  }

  async function handleEmbed(targetUrl = url) {
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

    if (pollingRef.current) clearInterval(pollingRef.current);

    setError('');
    setIsProcessing(true);
    setCurrentStep(0);
    setProgress(15);
    setStatusText('Checking database and submitting to Bright Data...');
    setCompletedVideo(null);

    try {
      const initial = await submitVideoForIngestion(cleanUrl);

      // Case 1: Video is ALREADY in Neon PGVector
      if (initial.status === 'ready' || initial.alreadyExists) {
        setProgress(100);
        setCurrentStep(3);
        setIsProcessing(false);

        const videoRecord = {
          id: videoId,
          title: initial.title || `YouTube Video (${videoId})`,
          url: cleanUrl,
          channel: 'YouTube Creator',
          chunksCount: initial.chunksCount || 24,
          dimensions: 768,
          indexedAt: 'Already in Database',
        };

        setActiveVideo(videoRecord);
        setCompletedVideo(videoRecord);
        if (onEmbedSuccess) onEmbedSuccess(videoRecord);
        return;
      }

      // Case 2: Ingestion triggered via Bright Data (Asynchronous)
      const snapshotId = initial.snapshot_id;
      setProgress(35);
      setCurrentStep(0);
      setStatusText('Bright Data is collecting video transcript and metadata...');

      let attempts = 0;
      const maxAttempts = 40; // ~2 minutes polling

      pollingRef.current = setInterval(async () => {
        attempts += 1;

        // Progressively advance visual indicators
        if (attempts <= 5) {
          setProgress(Math.min(45, 25 + attempts * 4));
          setCurrentStep(0);
          setStatusText('Bright Data is scraping audio subtitles & metadata...');
        } else if (attempts <= 12) {
          setProgress(Math.min(70, 45 + (attempts - 5) * 3));
          setCurrentStep(1);
          setStatusText('Parsing transcript into semantic chunks...');
        } else {
          setProgress(Math.min(92, 70 + (attempts - 12) * 2));
          setCurrentStep(2);
          setStatusText('Generating Gemini 768-dim embeddings & storing in Neon...');
        }

        try {
          const statusRes = await pollVideoIngestionStatus(videoId, snapshotId);

          if (statusRes.status === 'ready') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setProgress(100);
            setCurrentStep(3);
            setIsProcessing(false);

            const videoRecord = {
              id: videoId,
              title: statusRes.title || `YouTube Video (${videoId})`,
              url: cleanUrl,
              channel: 'YouTube Creator',
              chunksCount: statusRes.chunksCount || 24,
              dimensions: 768,
              indexedAt: 'Just now',
            };

            setActiveVideo(videoRecord);
            setCompletedVideo(videoRecord);
            if (onEmbedSuccess) onEmbedSuccess(videoRecord);
          } else if (statusRes.status === 'failed') {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsProcessing(false);
            setError(statusRes.error || 'Video collection or indexing failed in Bright Data.');
          } else if (attempts >= maxAttempts) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setIsProcessing(false);
            setError('Ingestion took longer than expected. Please check again in a few moments.');
          }
        } catch (pollErr) {
          console.warn('Status poll warning:', pollErr.message);
        }
      }, 3500);
    } catch (err) {
      setIsProcessing(false);
      console.error('Submission error:', err);
      setError(err.message || 'Could not connect to the backend server. Please verify your connection.');
    }
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
            <span>DYNAMIC BRIGHT DATA × NEON PGVECTOR</span>
          </div>
          <h3>Paste Any YouTube URL & Index Vectors ⚡</h3>
          <p>
            Paste any YouTube video link. Bright Data scrapes the video subtitles, Gemini generates 768-dim
            vector embeddings, and Neon stores them for instant RAG answers!
          </p>
        </div>
        <div className="genz-sticker" style={{ transform: 'rotate(2deg)' }}>
          AUTOMATIC PIPELINE 🚀
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
              <Loader2 size={16} className="spin-icon" /> Scraping & Indexing…
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
        <span className="presets-label">SAMPLE QUICK TESTS:</span>
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
              <Loader2 size={15} className="spin-icon" /> {statusText || 'Processing Video Pipeline...'}
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
            <strong>BIG W! Video Indexed In Neon PGVector Successfully 🏆</strong>
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
                Gemini vector embeddings stored in Neon pgvector · Ready for conversational RAG queries.
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
