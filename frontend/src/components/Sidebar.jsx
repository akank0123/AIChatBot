import { useState } from 'react';
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import ProviderSelector from './ProviderSelector';
import DocumentUploader from './DocumentUploader';

export default function Sidebar({ provider, model, onProviderChange, onModelChange, sessionId, onIngested }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <>
            <div className="logo">
              <Brain size={20} />
              <span className="logo-text">RAG<span className="logo-accent">Bot</span></span>
            </div>
            {sessionId && (
              <span className="session-badge" title={sessionId}>
                Session: {sessionId.slice(0, 8)}…
              </span>
            )}
          </>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-body">
          <section className="sidebar-section">
            <ProviderSelector
              provider={provider}
              model={model}
              onProviderChange={onProviderChange}
              onModelChange={onModelChange}
            />
          </section>
          <div className="divider" />
          <section className="sidebar-section">
            <DocumentUploader sessionId={sessionId} onIngested={onIngested} />
          </section>
        </div>
      )}

      <style>{`
        .sidebar {
          width: 300px; flex-shrink: 0;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          transition: width 0.2s ease;
          overflow: hidden;
        }
        .sidebar.collapsed { width: 48px; }
        .sidebar-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px; border-bottom: 1px solid var(--border);
          gap: 8px; min-height: 54px;
        }
        .logo { display: flex; align-items: center; gap: 8px; color: var(--text-primary); }
        .logo-text { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
        .logo-accent { color: var(--accent); }
        .session-badge { font-size: 10px; color: var(--text-muted); background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 4px; padding: 2px 6px; }
        .collapse-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.15s; }
        .collapse-btn:hover { border-color: var(--accent); color: var(--accent); }
        .sidebar-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0; }
        .sidebar-section { padding: 16px; }
        .divider { height: 1px; background: var(--border); margin: 0 16px; }
      `}</style>
    </aside>
  );
}
