import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  CirclePlay,
  Database,
  FileText,
  Flame,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Youtube,
  Zap,
} from "lucide-react";
import UrlEmbedCard from "../components/UrlEmbedCard.jsx";
import { getActiveVideo } from "../services/videoStore.js";

export default function Dashboard() {
  const [activeVideo, setActiveVideo] = useState(getActiveVideo());

  useEffect(() => {
    function handleVideoChange() {
      setActiveVideo(getActiveVideo());
    }
    window.addEventListener("active_video_changed", handleVideoChange);
    return () =>
      window.removeEventListener("active_video_changed", handleVideoChange);
  }, []);

  return (
    <main className="page-content dashboard-page">
      {/* Eyebrow Badge with Gen Z touch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "22px",
        }}
      >
        <div className="sheryians-eyebrow" style={{ marginBottom: 0 }}>
          <Flame size={14} />
          <span>SHERYIANS × VIDIQ · RAG THAT ACTUALLY COOKS 🍳</span>
        </div>
        <span className="genz-sticker">BRO WATCHES AT 1X SPEED? 💀</span>
        <span className="genz-badge-w">BIG W 🏆</span>
      </div>

      {/* Hero Section */}
      <section className="hero-box">
        <div className="hero-main">
          <h1>
            Why Watch 1-Hr Vlogs? <br />
            <span className="orange-text">Just Ask AI, No Cap.</span>
            <span className="handwritten-slogan">let him cook fr 👨‍🍳</span>
          </h1>
          <p>
            Skip the clickbait and 40-minute filler. Turn any YouTube video into
            an interactive vector brain. Ask timestamps, inside tea, and exact
            facts — 100% transcript-grounded, zero hallucinations, periodt. 💅
          </p>
          <div className="hero-actions">
            <Link className="btn-primary" to="/chat">
              Ask Video Anything <ArrowRight size={16} />
            </Link>
            <Link className="btn-secondary" to="/videos">
              Explore Vector Chunks 👀
            </Link>
          </div>
        </div>

        <div className="hero-glow-element">
          <div className="glow-circle-outer" />
          <div className="glow-center-badge">
            <BrainCircuit size={40} />
          </div>
        </div>
      </section>

      {/* Gen Z Live Ticker Strip */}
      <div className="genz-marquee-strip">
        <div className="genz-marquee-track">
          <span style={{ color: "var(--primary-orange)" }}>// VIBE CHECK:</span>
          <span>🔥 PURE FACTS, NO CAP 🧢</span>
          <span>·</span>
          <span>⚡ NEON PGVECTOR ON SPEED DIAL</span>
          <span>·</span>
          <span>🧠 768-DIM GEMINI VECTORS</span>
          <span>·</span>
          <span>🚀 GROQ LLAMA 3 GOES BRRR</span>
          <span>·</span>
          <span>💅 ZERO HALLUCINATIONS, PERIODT</span>
          <span>·</span>
          <span className="genz-badge-w">100% GROUNDED</span>
          <span>·</span>
          <span style={{ color: "var(--primary-orange)" }}>// VIBE CHECK:</span>
          <span>🔥 PURE FACTS, NO CAP 🧢</span>
          <span>·</span>
          <span>⚡ NEON PGVECTOR ON SPEED DIAL</span>
          <span>·</span>
          <span>🧠 768-DIM GEMINI VECTORS</span>
          <span>·</span>
          <span>🚀 GROQ LLAMA 3 GOES BRRR</span>
          <span>·</span>
          <span>💅 ZERO HALLUCINATIONS, PERIODT</span>
          <span>·</span>
          <span className="genz-badge-w">100% GROUNDED</span>
        </div>
      </div>

      {/* NEW: Paste YouTube URL & Generate Embeddings Card */}
      <UrlEmbedCard onEmbedSuccess={(video) => setActiveVideo(video)} />

      {/* Section: Featured Active Video */}
      <div className="section-header" style={{ marginTop: "32px" }}>
        <div>
          <div className="section-tag">CURRENT ACTIVE VECTOR BRAIN</div>
          <h2 className="section-title">Currently Indexed Video 🏎️</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="genz-vibe-pill">ID: {activeVideo.id}</span>
          <div className="sheryians-pill-live">
            <span className="dot" />
            <span>READY TO SPILL</span>
          </div>
        </div>
      </div>

      <article className="featured-video-bento">
        <div className="video-thumb-wrap">
          <img
            src={`https://img.youtube.com/vi/${activeVideo.id}/hqdefault.jpg`}
            alt={`${activeVideo.title} thumbnail`}
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=600&q=80";
            }}
          />
          <div className="play-overlay">
            <div className="play-badge-icon">
              <CirclePlay size={26} />
            </div>
          </div>
          <span className="youtube-pill">
            <Youtube size={13} style={{ color: "#ff0000" }} /> YOUTUBE
          </span>
        </div>

        <div className="video-info-content">
          <div className="video-status-meta">
            <CheckCircle2 size={15} />
            <span>
              {activeVideo.chunksCount || 24} CHUNKS LOADED IN PGVECTOR · READY
              FOR CHAT 🧾
            </span>
          </div>
          <h3>{activeVideo.title}</h3>
          <p>
            Transcript chunks tokenized with 768-dim embeddings. Ask anything
            about key events, timestamps, prices, and reactions without sitting
            through 40 minutes of filler.
          </p>

          <div className="video-tags-row">
            <div className="video-tag">
              <FileText size={15} />
              <span>Full Audio Transcript Chunks</span>
            </div>
            <div className="video-tag">
              <Database size={15} />
              <span>Cosine Vector Match (768d)</span>
            </div>
            <div className="video-tag">
              <Zap size={15} />
              <span>Sub-50ms Retrieval</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link className="btn-primary" to="/chat">
              Spill The Tea In Chat <ArrowRight size={16} />
            </Link>
            <span className="genz-sticker">SHEEEESH 🥶</span>
          </div>
        </div>
      </article>

      {/* Section: Bento Workflow with Gen Z Flavors */}
      <div className="section-header" style={{ marginTop: "28px" }}>
        <div>
          <div className="section-tag">THE PIPELINE THAT COOKS</div>
          <h2 className="section-title">
            How Sheryians RAG Works Behind The Scenes 🍳
          </h2>
        </div>
      </div>

      <div className="bento-grid">
        <div className="bento-card">
          <div className="bento-card-top">
            <div className="bento-icon orange">
              <FileText size={20} />
            </div>
            <span className="bento-step">01 / WE SLICE IT 🔪</span>
          </div>
          <h4>Transcript Chunking</h4>
          <p>
            RecursiveCharacterTextSplitter cuts Hindi/English audio streams into
            500-token chunks with 50-token semantic overlap. No context lost.
          </p>
        </div>

        <div className="bento-card">
          <div className="bento-card-top">
            <div className="bento-icon blue">
              <Database size={20} />
            </div>
            <span className="bento-step">02 / WE VECTORIZE 🧠</span>
          </div>
          <h4>Gemini 768-Dim Math</h4>
          <p>
            Google text-embedding-004 maps colloquial slang, Hinglish phrases,
            and timestamps into geometric points in vector hyperspace.
          </p>
        </div>

        <div className="bento-card">
          <div className="bento-card-top">
            <div className="bento-icon green">
              <Zap size={20} />
            </div>
            <span className="bento-step">03 / WE SPILL FACTS ⚡</span>
          </div>
          <h4>Groq Ultra Inference</h4>
          <p>
            Groq Llama 3 executes retrieval augmented answers at 800+ tokens/sec
            grounded strictly in transcripts. Zero cap, zero hallucinations.
          </p>
        </div>
      </div>

      {/* Bottom Sheryians Callout Bar */}
      <div className="sheryians-callout">
        <div className="callout-left">
          <ShieldCheck size={28} className="callout-icon" />
          <div className="callout-text">
            <strong>100% Transcript-Grounded Guarantee</strong>
            <p>
              If the YouTuber didn't say it in the video, our RAG agent won't
              make it up. True facts only.
            </p>
          </div>
        </div>
        <Link className="btn-secondary" to="/chat">
          Test Live Vibe <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
