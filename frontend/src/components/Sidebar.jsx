import { Brain } from 'lucide-react';
import ProviderSelector from './ProviderSelector';
import DocumentUploader from './DocumentUploader';

export default function Sidebar({ provider, model, onProviderChange, onModelChange, sessionId, onIngested }) {
  return (
    <div
      className="offcanvas offcanvas-lg offcanvas-start app-sidebar"
      tabIndex="-1"
      id="sidebarOffcanvas"
      aria-labelledby="sidebarLabel"
    >
      {/* Accent gradient strip */}
      <div className="sidebar-accent-strip" />

      {/* Offcanvas header — mobile only (hidden on lg+ via CSS) */}
      <div
        className="offcanvas-header"
        style={{ borderBottom: '1px solid var(--border-dim)', padding: '14px 18px', background: 'linear-gradient(180deg, rgba(157,124,250,0.06) 0%, transparent 100%)' }}
      >
        <div className="logo-wrap">
          <div className="logo-icon">
            <Brain size={18} />
          </div>
          <h5 className="logo-title mb-0" id="sidebarLabel">
            RAG<span className="accent">Bot</span>
          </h5>
        </div>
        <div className="d-flex align-items-center gap-2">
          {sessionId && <span className="session-badge">{sessionId.slice(0, 8)}…</span>}
          <button
            type="button"
            className="btn-close btn-close-sidebar"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
      </div>

      {/* Desktop-only header (hidden on mobile via d-none d-lg-flex) */}
      <div className="sidebar-header d-none d-lg-flex">
        <div className="logo-wrap">
          <div className="logo-icon">
            <Brain size={18} />
          </div>
          <span className="logo-title">RAG<span className="accent">Bot</span></span>
        </div>
        {sessionId && <span className="session-badge">{sessionId.slice(0, 8)}…</span>}
      </div>

      {/* Body */}
      <div className="sidebar-body offcanvas-body p-0">
        {/* Provider section */}
        <div className="sidebar-section" style={{ borderBottom: '1px solid var(--border-dim)' }}>
          <p className="sidebar-section-label">AI Provider</p>
          <ProviderSelector
            provider={provider}
            model={model}
            onProviderChange={onProviderChange}
            onModelChange={onModelChange}
          />
        </div>

        {/* Knowledge base section */}
        <div className="sidebar-section flex-grow-1">
          <DocumentUploader sessionId={sessionId} onIngested={onIngested} />
        </div>
      </div>
    </div>
  );
}
