import React from 'react';
import { Search, Flame, CircleHelp, Bell, Github } from 'lucide-react';
import Sidebar from './Sidebar.jsx';

export default function Layout({ children, title = 'Workspace' }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <div className="breadcrumb-path">
              <span>Sheryians RAG</span>
              <span className="crumb-sep">/</span>
              <span className="breadcrumb-active">{title}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-bar">
              <Search size={15} />
              <input type="text" placeholder="Search transcripts & queries…" readOnly />
              <kbd>⌘ K</kbd>
            </div>

            <div className="sheryians-pill-live">
              <span className="dot" />
              <span>LIVE COGNITION</span>
            </div>

            <button className="icon-btn" aria-label="Sheryians Coding School">
              <Flame size={17} style={{ color: 'var(--primary-orange)' }} />
            </button>

            <button className="icon-btn" aria-label="Notifications">
              <Bell size={17} />
            </button>
          </div>
        </header>

        {children}

        <footer className="footer-bar">
          <div>
            <span>VidiQ AI · Powered by <strong className="sheryians-credit">Sheryians Coding School</strong> design ethos</span>
          </div>
          <div>
            <span>Grounded Answers · Zero Hallucinations · Next-Gen Vector Search</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
