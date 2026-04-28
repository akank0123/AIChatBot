import { useState } from 'react';
import { Brain, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

export default function App() {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState(null);
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [kbVersion, setKbVersion] = useState(0);

  return (
    <div className="app-shell">
      {/* Mobile-only top navbar */}
      <nav className="navbar mobile-navbar d-lg-none">
        <div className="container-fluid px-3">
          <div className="d-flex align-items-center gap-2">
            <button
              className="icon-btn me-1"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebarOffcanvas"
              aria-controls="sidebarOffcanvas"
              aria-label="Open sidebar"
            >
              <Menu size={17} />
            </button>
            <a className="mobile-nav-brand" href="#">
              <div className="logo-icon" style={{ width: 28, height: 28, borderRadius: 7 }}>
                <Brain size={15} />
              </div>
              <span className="fw-bold fs-6">RAG<span className="accent">Bot</span></span>
            </a>
          </div>
          <span className="session-badge">{sessionId.slice(0, 8)}…</span>
        </div>
      </nav>

      {/* Sidebar + chat */}
      <div className="app-body">
        <Sidebar
          provider={provider}
          model={model}
          onProviderChange={setProvider}
          onModelChange={setModel}
          sessionId={sessionId}
          onIngested={() => setKbVersion(v => v + 1)}
        />

        <main className="flex-grow-1 d-flex flex-column overflow-hidden">
          <ChatInterface
            key={sessionId}
            sessionId={sessionId}
            setSessionId={setSessionId}
            provider={provider}
            model={model}
            kbVersion={kbVersion}
          />
        </main>
      </div>
    </div>
  );
}
