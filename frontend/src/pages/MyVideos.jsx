import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CirclePlay,
  Database,
  FileText,
  Flame,
  Plus,
  Search,
  ShieldCheck,
  Video,
  Youtube,
  Zap,
  Check,
} from "lucide-react";
import UrlEmbedCard from "../components/UrlEmbedCard.jsx";
import {
  getActiveVideo,
  getVideos,
  setActiveVideo,
} from "../services/videoStore.js";

export default function MyVideos() {
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState(getVideos());
  const [activeVideo, setActive] = useState(getActiveVideo());

  useEffect(() => {
    function refreshList() {
      setVideos(getVideos());
      setActive(getActiveVideo());
    }
    window.addEventListener("videos_list_changed", refreshList);
    window.addEventListener("active_video_changed", refreshList);
    return () => {
      window.removeEventListener("videos_list_changed", refreshList);
      window.removeEventListener("active_video_changed", refreshList);
    };
  }, []);

  const filtered = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="page-content videos-page-wrap">
      {/* Eyebrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div className="sheryians-eyebrow" style={{ marginBottom: 0 }}>
          <Video size={14} />
          <span>VIDEO REPOSITORY · VECTOR INDEX</span>
        </div>
        <span className="genz-sticker">ZERO FLUFF 🧠</span>
      </div>

      {/* Header Banner */}
      <div className="page-title-banner">
        <div>
          <h1>My Videos Library</h1>
          <p>
            Explore videos indexed into high-dimensional vector embeddings or
            paste a new URL below.
          </p>
        </div>
        <Link className="btn-primary" to="/chat">
          <Plus size={16} /> Open Video Chat
        </Link>
      </div>

      {/* URL Embed Card Component */}
      <UrlEmbedCard
        onEmbedSuccess={() => {
          setVideos(getVideos());
          setActive(getActiveVideo());
        }}
      />

      {/* Stats Grid */}
      <div className="stats-counter-grid" style={{ marginTop: "12px" }}>
        <div className="stat-tile">
          <div className="stat-icon">
            <Youtube size={22} />
          </div>
          <div className="stat-info">
            <span>INDEXED VIDEOS</span>
            <strong>{videos.length} Available</strong>
          </div>
        </div>

        <div className="stat-tile">
          <div
            className="stat-icon"
            style={{
              background: "var(--electric-blue-light)",
              color: "var(--electric-blue)",
            }}
          >
            <Database size={22} />
          </div>
          <div className="stat-info">
            <span>VECTOR STORE</span>
            <strong>Neon Postgres pgvector</strong>
          </div>
        </div>

        <div className="stat-tile">
          <div
            className="stat-icon"
            style={{
              background: "var(--emerald-green-light)",
              color: "var(--emerald-green)",
            }}
          >
            <Zap size={22} />
          </div>
          <div className="stat-info">
            <span>EMBEDDINGS MATH</span>
            <strong style={{ color: "var(--emerald-green)" }}>
              768-Dim Gemini
            </strong>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginTop: "10px",
        }}
      >
        <div className="search-bar" style={{ minWidth: "320px" }}>
          <Search size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search indexed video titles…"
          />
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {filtered.length} {filtered.length === 1 ? "video" : "videos"} found
        </span>
      </div>

      {/* Video Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {filtered.length > 0 ? (
          filtered.map((v) => {
            const isActive = activeVideo.id === v.id;
            return (
              <article
                key={v.id}
                className="video-library-card"
                style={{
                  borderColor: isActive
                    ? "rgba(232, 96, 46, 0.6)"
                    : "var(--glass-border)",
                  boxShadow: isActive
                    ? "0 0 24px rgba(232, 96, 46, 0.2)"
                    : "var(--glass-shine)",
                }}
              >
                <div className="lib-thumb">
                  <img
                    src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                    alt={v.title}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="play-overlay">
                    <CirclePlay size={32} />
                  </div>
                </div>

                <div className="lib-details">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <span className="sheryians-tag">INDEXED</span>
                    {isActive && (
                      <span className="genz-badge-w">ACTIVE BRAIN 🧠</span>
                    )}
                    <span
                      style={{ fontSize: "11px", color: "var(--text-muted)" }}
                    >
                      YouTube ID: {v.id}
                    </span>
                  </div>

                  <h3>{v.title}</h3>
                  <p>
                    Full transcript tokenized into {v.chunksCount || 24} chunks
                    and stored in Neon pgvector. Ready for semantic search,
                    timestamps, and deep conversational exploration.
                  </p>

                  <div className="lib-tags">
                    <span>
                      <FileText size={14} /> Full Transcript
                    </span>
                    <span>
                      <Database size={14} /> 768-dim Vector Embeddings
                    </span>
                    <span>
                      <Flame size={14} /> Groq Llama 3 Ready
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <Link
                    className="btn-primary"
                    to="/chat"
                    onClick={() => setActiveVideo(v)}
                  >
                    Launch Chat <ArrowRight size={15} />
                  </Link>
                  {!isActive && (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: "12px", padding: "8px 12px" }}
                      onClick={() => setActiveVideo(v)}
                    >
                      <Check size={14} /> Set Active
                    </button>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "var(--glass-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px dashed var(--glass-border)",
            }}
          >
            <Youtube
              size={48}
              style={{
                color: "var(--text-dark)",
                margin: "0 auto 14px",
                display: "block",
              }}
            />
            <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>
              No Indexed Videos Found
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "20px",
              }}
            >
              Paste any YouTube video link above to generate vector embeddings.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
