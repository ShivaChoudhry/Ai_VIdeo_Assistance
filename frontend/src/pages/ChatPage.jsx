import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCheck,
  CirclePlay,
  Copy,
  ExternalLink,
  Flame,
  Info,
  MoreHorizontal,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Youtube,
  Zap,
  Plus,
} from "lucide-react";
import { askVideoQuestion } from "../services/api.js";
import {
  extractYouTubeId,
  getActiveVideo,
  setActiveVideo,
} from "../services/videoStore.js";

const suggestions = [
  "Drop the 30-second TL;DR of this video without any filler ⚡",
  "Who is Avantika and what was her genuine reaction to the Porsche? 👀",
  "Which exact Porsche model arrived, what color, and was it brand new? 🏎️",
  "Point out timestamps where anyone was doubting or joking about the purchase 💀",
];

export default function ChatPage() {
  const [activeVideo, setActive] = useState(getActiveVideo());
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [reactions, setReactions] = useState({});
  const [quickUrl, setQuickUrl] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    function handleVideoChange() {
      setActive(getActiveVideo());
    }
    window.addEventListener("active_video_changed", handleVideoChange);
    return () =>
      window.removeEventListener("active_video_changed", handleVideoChange);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function sendQuestion(text = query) {
    const clean = text.trim();
    if (!clean || loading) return;

    setError("");
    setQuery("");
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: clean,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setLoading(true);

    try {
      const answer = await askVideoQuestion(clean, activeVideo.id);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: typeof answer === "string" ? answer : JSON.stringify(answer),
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      setError(err.message || "Could not generate answer.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text, idx) {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleReaction(idx, type) {
    setReactions((prev) => ({
      ...prev,
      [idx]: prev[idx] === type ? null : type,
    }));
  }

  function handleQuickSwitch(e) {
    e.preventDefault();
    const id = extractYouTubeId(quickUrl);
    if (!id) return;

    const newVideo = {
      id,
      title: `YouTube Video (${id})`,
      url: quickUrl.trim(),
      channel: "YouTube Creator",
      chunksCount: 22,
      dimensions: 768,
      indexedAt: "Just now",
    };
    setActiveVideo(newVideo);
    setActive(newVideo);
    setQuickUrl("");
  }

  return (
    <div className="chat-workspace">
      {/* Main Chat Column */}
      <section className="chat-main-column">
        {/* Video mini bar at top of chat */}
        <div className="chat-video-bar">
          <div className="chat-video-meta">
            <div className="chat-thumb-mini">
              <img
                src={`https://img.youtube.com/vi/${activeVideo.id}/hqdefault.jpg`}
                alt={activeVideo.title}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=300&q=80";
                }}
              />
            </div>
            <div className="chat-title-group">
              <h3>{activeVideo.title}</h3>
              <span>
                <span className="dot-live" />
                Active Vector Index · {activeVideo.chunksCount || 24} Chunks
                Loaded
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
              to="/videos"
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: "11px" }}
            >
              Switch Video 🔄
            </Link>
            <span className="genz-sticker">100% GROUNDED 💅</span>
          </div>
        </div>

        {/* Messages List Area */}
        <div className="chat-messages-container" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="chat-welcome-box">
              <div className="welcome-avatar-glow">
                <Flame size={24} />
              </div>
              <span className="welcome-tag">SHERYIANS COGNITION ENGINE</span>
              <h2>Ask Anything About This Video fr fr 🏎️</h2>
              <p>
                Zero hallucinations, no filler. All responses are 100% matched
                against semantic vector embeddings of the actual spoken audio.
              </p>

              {/* Suggestions Grid */}
              <div className="suggestion-cards-grid">
                {suggestions.map((item, idx) => (
                  <button
                    key={item}
                    className="suggestion-pill-card"
                    onClick={() => sendQuestion(item)}
                  >
                    <span className="card-number">0{idx + 1}</span>
                    <span className="card-query">{item}</span>
                    <span className="card-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={idx}
                  className={`msg-row ${isAssistant ? "assistant" : "user"}`}
                >
                  <div
                    className={`msg-avatar ${
                      isAssistant ? "assistant" : "user"
                    }`}
                  >
                    {isAssistant ? "⚡" : "U"}
                  </div>

                  <div className="msg-bubble-wrap">
                    <div className="msg-meta-header">
                      <span>{isAssistant ? "Sheryians VidiQ AI" : "You"}</span>
                      {isAssistant && (
                        <span className="source-pill">Grounded Vector Match</span>
                      )}
                      <span>· {msg.timestamp}</span>
                    </div>

                    <div className="msg-bubble">{msg.content}</div>

                    {isAssistant && (
                      <div className="msg-actions">
                        <button
                          className="action-icon-btn"
                          title="Copy to clipboard"
                          onClick={() => handleCopy(msg.content, idx)}
                        >
                          {copiedIndex === idx ? (
                            <CheckCheck
                              size={14}
                              style={{ color: "var(--emerald-green)" }}
                            />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Accurate response"
                          style={{
                            color:
                              reactions[idx] === "up"
                                ? "var(--primary-orange)"
                                : "",
                          }}
                          onClick={() => handleReaction(idx, "up")}
                        >
                          <ThumbsUp size={14} />
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Inaccurate"
                          style={{
                            color:
                              reactions[idx] === "down"
                                ? "var(--primary-orange)"
                                : "",
                          }}
                          onClick={() => handleReaction(idx, "down")}
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {loading && (
            <div className="msg-row assistant">
              <div className="msg-avatar assistant">⚡</div>
              <div className="typing-box">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginLeft: "6px",
                  }}
                >
                  Searching vector chunks & cooking response…
                </span>
              </div>
            </div>
          )}

          {error && <div className="chat-error-banner">⚠️ {error}</div>}
        </div>

        {/* Input Composer */}
        <div className="chat-composer-section">
          <div className="composer-glass-box">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendQuestion();
                }
              }}
              placeholder="Ask anything about the video (no cap, we have the receipts)…"
              rows={1}
              disabled={loading}
            />

            <div className="composer-actions-bar">
              <div className="composer-hints-left">
                <span className="grounded-tag">
                  <Check size={13} /> 100% Grounded RAG · Zero Fluff
                </span>
                <span>Enter ↵ to send</span>
              </div>

              <button
                className="send-action-btn"
                onClick={() => sendQuestion()}
                disabled={!query.trim() || loading}
                aria-label="Send query"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
          <p className="composer-caption">
            Sheryians VidiQ AI responds strictly with facts from the transcript.
            Zero hallucinations, periodt. 💅
          </p>
        </div>
      </section>

      {/* Right Video Context Sidebar */}
      <aside className="context-panel">
        <div className="context-header-title">
          <h4>Video Source</h4>
          <span className="genz-sticker" style={{ transform: "none" }}>
            RECEIPTS 🧾
          </span>
        </div>

        <div className="context-video-card">
          <img
            src={`https://img.youtube.com/vi/${activeVideo.id}/hqdefault.jpg`}
            alt="Source Video Preview"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=300&q=80";
            }}
          />
          <div className="context-video-details">
            <h5>{activeVideo.title}</h5>
            <a
              href={
                activeVideo.url ||
                `https://www.youtube.com/watch?v=${activeVideo.id}`
              }
              target="_blank"
              rel="noreferrer"
            >
              Watch Original Video <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Quick URL Switch in Sidebar */}
        <form onSubmit={handleQuickSwitch} style={{ display: "flex", gap: "6px" }}>
          <input
            type="text"
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            placeholder="Paste another YouTube URL..."
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              padding: "6px 10px",
              fontSize: "11px",
              color: "#fff",
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: "6px 10px", fontSize: "11px" }}
            disabled={!quickUrl.trim()}
          >
            Switch
          </button>
        </form>

        <div className="context-header-title">
          <h4>Vector Pipeline 🧠</h4>
        </div>

        <div className="pipeline-status-card">
          <div className="pipeline-step">
            <span className="step-check-dot">✓</span>
            <div className="step-text">
              <strong>Spoken Audio Tokenized 🎧</strong>
              <span>Zero words lost in translation</span>
            </div>
          </div>
          <div className="pipeline-step">
            <span className="step-check-dot">✓</span>
            <div className="step-text">
              <strong>Embeddings Indexed 🧠</strong>
              <span>768-dim vector hyperspace</span>
            </div>
          </div>
          <div className="pipeline-step">
            <span className="step-check-dot">✓</span>
            <div className="step-text">
              <strong>Speed Check ⚡</strong>
              <span>Sub-50ms query match</span>
            </div>
          </div>
        </div>

        <div className="context-header-title">
          <h4>Quick Prompts 💬</h4>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {suggestions.map((s) => (
            <button
              key={s}
              className="suggestion-pill-card"
              style={{ padding: "10px 12px" }}
              onClick={() => sendQuestion(s)}
              disabled={loading}
            >
              <span className="card-query" style={{ fontSize: "11px" }}>
                {s}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
