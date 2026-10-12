import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  Flame,
  Send,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import { askVideoQuestion } from "../services/api.js";

import {
  extractYouTubeId,
  getActiveVideo,
  setActiveVideo,
} from "../services/videoStore.js";

const suggestions = [
  "Give me a short summary of this video.",
  "What are the most important things discussed in this video?",
  "Explain the main events in chronological order.",
  "What useful information can I learn from this video?",
];

function getTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function getYouTubeUrl(video) {
  return (
    video.url ||
    `https://www.youtube.com/watch?v=${video.id}`
  );
}

function createMessage(role, content) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: getTimestamp(),
  };
}

export default function ChatPage() {
  const [activeVideo, setActive] = useState(() => getActiveVideo());

  // Each video's conversation is stored separately.
  const [messagesByVideo, setMessagesByVideo] = useState({});

  const [query, setQuery] = useState("");

  // Track requests by video ID so switching videos does not mix their state.
  const [loadingVideoIds, setLoadingVideoIds] = useState([]);

  // Keep errors separate for each video.
  const [errorsByVideo, setErrorsByVideo] = useState({});

  // Use message IDs instead of array indexes for reactions and copying.
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [reactions, setReactions] = useState({});

  const [quickUrl, setQuickUrl] = useState("");
  const [quickSwitchError, setQuickSwitchError] = useState("");

  const scrollRef = useRef(null);

  const videoId = activeVideo.id;
  const messages = messagesByVideo[videoId] || [];
  const loading = loadingVideoIds.includes(videoId);
  const error = errorsByVideo[videoId] || "";

  // Listen for video changes from Dashboard, My Videos, or other components.
  useEffect(() => {
    function handleVideoChange() {
      const updatedVideo = getActiveVideo();

      if (updatedVideo?.id) {
        setActive(updatedVideo);
        setQuery("");
        setQuickSwitchError("");
      }
    }

    window.addEventListener(
      "active_video_changed",
      handleVideoChange
    );

    return () => {
      window.removeEventListener(
        "active_video_changed",
        handleVideoChange
      );
    };
  }, []);

  // Scroll to the latest message whenever the current conversation changes.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading, error]);

  // Append a message to the conversation belonging to a specific video.
  function appendMessage(targetVideoId, message) {
    setMessagesByVideo((previous) => ({
      ...previous,
      [targetVideoId]: [
        ...(previous[targetVideoId] || []),
        message,
      ],
    }));
  }

  function setVideoLoading(targetVideoId, isLoading) {
    setLoadingVideoIds((previous) => {
      if (isLoading) {
        return previous.includes(targetVideoId)
          ? previous
          : [...previous, targetVideoId];
      }

      return previous.filter((id) => id !== targetVideoId);
    });
  }

  function setVideoError(targetVideoId, message) {
    setErrorsByVideo((previous) => ({
      ...previous,
      [targetVideoId]: message,
    }));
  }

  async function sendQuestion(text = query) {
    const clean = text.trim();

    if (!clean || loading) {
      return;
    }

    // Capture the video ID before the request starts.
    // If the user switches videos, this request still belongs to the
    // original video.
    const targetVideoId = activeVideo.id;

    setVideoError(targetVideoId, "");
    setQuery("");

    appendMessage(
      targetVideoId,
      createMessage("user", clean)
    );

    setVideoLoading(targetVideoId, true);

    try {
      // Existing backend API:
      // POST /generate
      // { query, video_id }
      const answer = await askVideoQuestion(
        clean,
        targetVideoId
      );

      const answerText =
        typeof answer === "string"
          ? answer
          : JSON.stringify(answer);

      appendMessage(
        targetVideoId,
        createMessage("assistant", answerText)
      );
    } catch (err) {
      console.error(
        `Failed to generate answer for video ${targetVideoId}:`,
        err
      );

      setVideoError(
        targetVideoId,
        err.message || "Could not generate an answer. Please try again."
      );
    } finally {
      setVideoLoading(targetVideoId, false);
    }
  }

  async function handleCopy(text, messageId) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);

      setTimeout(() => {
        setCopiedMessageId((current) =>
          current === messageId ? null : current
        );
      }, 2000);
    } catch (err) {
      console.error("Could not copy message:", err);
      setVideoError(
        activeVideo.id,
        "Could not copy the message. Check browser clipboard permissions."
      );
    }
  }

  function handleReaction(messageId, type) {
    setReactions((previous) => ({
      ...previous,
      [messageId]:
        previous[messageId] === type ? null : type,
    }));
  }

  function handleQuickSwitch(event) {
    event.preventDefault();

    setQuickSwitchError("");

    const id = extractYouTubeId(quickUrl);

    if (!id) {
      setQuickSwitchError(
        "Please enter a valid YouTube video URL."
      );
      return;
    }

    // Avoid switching to the same video unnecessarily.
    if (id === activeVideo.id) {
      setQuickUrl("");
      return;
    }

    // Selecting a URL is not the same as indexing its transcript.
    // Backend ingestion and index-status verification can be connected later.
    const newVideo = {
      id,
      title: `YouTube Video (${id})`,
      url: `https://www.youtube.com/watch?v=${id}`,
      channel: "YouTube Creator",
      chunksCount: null,
      dimensions: null,
      indexedAt: null,
    };

    setActiveVideo(newVideo);
    setActive(newVideo);
    setQuickUrl("");
    setQuery("");
  }

  function handleThumbnailError(event) {
    event.currentTarget.onerror = null;
    event.currentTarget.src =
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=300&q=80";
  }

  return (
    <div className="chat-workspace">
      {/* Main Chat Column */}
      <section className="chat-main-column">
        {/* Active Video Header */}
        <div className="chat-video-bar">
          <div className="chat-video-meta">
            <div className="chat-thumb-mini">
              <img
                src={getYouTubeThumbnail(activeVideo.id)}
                alt={activeVideo.title}
                onError={handleThumbnailError}
              />
            </div>

            <div className="chat-title-group">
              <h3>{activeVideo.title}</h3>

              <span>
                <span className="dot-live" />
                Selected Video · {activeVideo.id}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Link
              to="/videos"
              className="btn-secondary"
              style={{
                padding: "6px 12px",
                fontSize: "11px",
              }}
            >
              Switch Video 🔄
            </Link>

            <span className="genz-sticker">
              VidiQ AI ✨
            </span>
          </div>
        </div>

        {/* Messages */}
        <div
          className="chat-messages-container"
          ref={scrollRef}
        >
          {messages.length === 0 ? (
            <div className="chat-welcome-box">
              <div className="welcome-avatar-glow">
                <Flame size={24} />
              </div>

              <span className="welcome-tag">
                VIDIQ AI · VIDEO ASSISTANT
              </span>

              <h2>Ask Anything About This Video 🎬</h2>

              <p>
                Ask questions about the selected YouTube video.
                Answers are generated using the backend retrieval
                pipeline and the available video transcript.
              </p>

              {/* Suggested Questions */}
              <div className="suggestion-cards-grid">
                {suggestions.map((item, index) => (
                  <button
                    key={item}
                    className="suggestion-pill-card"
                    onClick={() => sendQuestion(item)}
                    disabled={loading}
                  >
                    <span className="card-number">
                      0{index + 1}
                    </span>

                    <span className="card-query">
                      {item}
                    </span>

                    <span className="card-arrow">→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isAssistant =
                message.role === "assistant";

              const reaction = reactions[message.id];

              return (
                <div
                  key={message.id}
                  className={`msg-row ${
                    isAssistant ? "assistant" : "user"
                  }`}
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
                      <span>
                        {isAssistant
                          ? "VidiQ AI"
                          : "You"}
                      </span>

                      {isAssistant && (
                        <span className="source-pill">
                          AI Response
                        </span>
                      )}

                      <span>· {message.timestamp}</span>
                    </div>

                    <div className="msg-bubble">
                      {message.content}
                    </div>

                    {isAssistant && (
                      <div className="msg-actions">
                        <button
                          className="action-icon-btn"
                          title="Copy to clipboard"
                          onClick={() =>
                            handleCopy(
                              message.content,
                              message.id
                            )
                          }
                        >
                          {copiedMessageId === message.id ? (
                            <CheckCheck
                              size={14}
                              style={{
                                color: "var(--emerald-green)",
                              }}
                            />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>

                        <button
                          className="action-icon-btn"
                          title="Accurate response"
                          aria-label="Mark response as accurate"
                          aria-pressed={reaction === "up"}
                          style={{
                            color:
                              reaction === "up"
                                ? "var(--primary-orange)"
                                : "",
                          }}
                          onClick={() =>
                            handleReaction(message.id, "up")
                          }
                        >
                          <ThumbsUp size={14} />
                        </button>

                        <button
                          className="action-icon-btn"
                          title="Inaccurate response"
                          aria-label="Mark response as inaccurate"
                          aria-pressed={reaction === "down"}
                          style={{
                            color:
                              reaction === "down"
                                ? "var(--primary-orange)"
                                : "",
                          }}
                          onClick={() =>
                            handleReaction(message.id, "down")
                          }
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

          {/* Loading Indicator */}
          {loading && (
            <div className="msg-row assistant">
              <div className="msg-avatar assistant">
                ⚡
              </div>

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
                  Retrieving video context and generating an answer…
                </span>
              </div>
            </div>
          )}

          {/* Backend Errors */}
          {error && (
            <div
              className="chat-error-banner"
              role="alert"
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div className="chat-composer-section">
          <div className="composer-glass-box">
            <textarea
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  sendQuestion();
                }
              }}
              placeholder="Ask anything about the selected video..."
              rows={1}
              disabled={loading}
            />

            <div className="composer-actions-bar">
              <div className="composer-hints-left">
                <span className="grounded-tag">
                  <Check size={13} />
                  Transcript-based RAG
                </span>

                <span>Enter ↵ to send</span>
              </div>

              <button
                className="send-action-btn"
                onClick={() => sendQuestion()}
                disabled={!query.trim() || loading}
                aria-label="Send question"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          <p className="composer-caption">
            VidiQ AI uses the backend retrieval pipeline to answer
            questions about the selected video. Accuracy depends
            on the transcript and retrieved context.
          </p>
        </div>
      </section>

      {/* Right Video Context Sidebar */}
      <aside className="context-panel">
        <div className="context-header-title">
          <h4>Video Source</h4>

          <span
            className="genz-sticker"
            style={{ transform: "none" }}
          >
            SOURCE 🧾
          </span>
        </div>

        {/* Video Preview */}
        <div className="context-video-card">
          <img
            src={getYouTubeThumbnail(activeVideo.id)}
            alt={`Thumbnail for ${activeVideo.title}`}
            onError={handleThumbnailError}
          />

          <div className="context-video-details">
            <h5>{activeVideo.title}</h5>

            <a
              href={getYouTubeUrl(activeVideo)}
              target="_blank"
              rel="noreferrer"
            >
              Watch Original Video{" "}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Quick Video Switch */}
        <form
          onSubmit={handleQuickSwitch}
          style={{
            display: "flex",
            gap: "6px",
          }}
        >
          <input
            type="text"
            value={quickUrl}
            onChange={(event) => {
              setQuickUrl(event.target.value);
              setQuickSwitchError("");
            }}
            placeholder="Paste YouTube URL..."
            aria-label="YouTube video URL"
            style={{
              flex: 1,
              minWidth: 0,
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
            style={{
              padding: "6px 10px",
              fontSize: "11px",
            }}
            disabled={!quickUrl.trim()}
          >
            Switch
          </button>
        </form>

        {quickSwitchError && (
          <p
            role="alert"
            style={{
              fontSize: "11px",
              color: "var(--primary-orange)",
              marginTop: "8px",
            }}
          >
            {quickSwitchError}
          </p>
        )}

        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            lineHeight: 1.5,
            marginTop: "8px",
          }}
        >
          Switching selects a video. The video must also be
          indexed in the backend before its transcript can be
          retrieved.
        </p>

        {/* Pipeline Information */}
        <div className="context-header-title">
          <h4>Vector Pipeline 🧠</h4>
        </div>

        <div className="pipeline-status-card">
          <div className="pipeline-step">
            <span className="step-check-dot">✓</span>

            <div className="step-text">
              <strong>Transcript Retrieval</strong>
              <span>
                Uses the selected video ID for retrieval
              </span>
            </div>
          </div>

          <div className="pipeline-step">
            <span className="step-check-dot">✓</span>

            <div className="step-text">
              <strong>Vector Search</strong>
              <span>
                Retrieves relevant transcript chunks
              </span>
            </div>
          </div>

          <div className="pipeline-step">
            <span className="step-check-dot">✓</span>

            <div className="step-text">
              <strong>LLM Response</strong>
              <span>
                Generates an answer using retrieved context
              </span>
            </div>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="context-header-title">
          <h4>Quick Prompts 💬</h4>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="suggestion-pill-card"
              style={{ padding: "10px 12px" }}
              onClick={() => sendQuestion(suggestion)}
              disabled={loading}
            >
              <span
                className="card-query"
                style={{ fontSize: "11px" }}
              >
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}