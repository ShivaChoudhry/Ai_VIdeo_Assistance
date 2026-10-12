import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Video, Sparkles, Plus, Cpu, Terminal, Flame } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'Video Chat', icon: MessageSquare },
  { to: '/videos', label: 'My Videos', icon: Video },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <div className="brand-mark">
          <Flame size={22} />
        </div>
        <div className="brand-info">
          <strong>
            VidiQ AI
            <span className="sheryians-tag">GEN-Z 🚀</span>
          </strong>
          <span>Curiosity into code (fr fr)</span>
        </div>
      </Link>

      <Link to="/chat" className="new-chat">
        <Plus size={18} /> New Conversation 💬
      </Link>

      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="recent-section">
        <div className="nav-label">RECENT TEA ☕</div>
        <Link className="recent-item" to="/chat">
          <Terminal size={14} />
          <span>Porsche delivery timestamps 🏎️</span>
        </Link>
        <Link className="recent-item" to="/chat">
          <Sparkles size={14} />
          <span>Avantika's reaction tea 👀</span>
        </Link>
      </div>

      <div className="sidebar-bottom">
        <div className="sheryians-badge-card">
          <div className="badge-row">
            <div className="badge-title">
              <span className="status-dot-pulse" />
              <span>RAG PIPELINE</span>
            </div>
            <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--primary-orange)' }}>READY</span>
          </div>
          <p className="badge-sub">Gemini 1.5 Embeddings · Neon pgvector Vector DB</p>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">S</div>
          <div className="profile-meta">
            <strong>Shiva Choudhry</strong>
            <span>Single-Video RAG Mode</span>
          </div>
          <Cpu size={16} style={{ color: 'var(--text-dark)' }} />
        </div>
      </div>
    </aside>
  );
}
