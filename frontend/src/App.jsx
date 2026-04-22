import { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

export default function App() {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [kbVersion, setKbVersion] = useState(0); // bumped on each ingest

  return (
    <div className="app-shell">
      <Sidebar
        provider={provider}
        model={model}
        onProviderChange={setProvider}
        onModelChange={setModel}
        sessionId={sessionId}
        onIngested={() => setKbVersion(v => v + 1)}
      />

      <main className="main-area">
        <ChatInterface
          key={sessionId}  // remount when session changes
          sessionId={sessionId}
          setSessionId={setSessionId}
          provider={provider}
          model={model}
          kbVersion={kbVersion}
        />
      </main>

      <style>{`
        .app-shell {
          height: 100vh; display: flex; overflow: hidden;
          background: var(--bg-primary);
        }
        .main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      `}</style>
    </div>
  );
}
