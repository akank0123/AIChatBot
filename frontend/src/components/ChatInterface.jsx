import { useState, useRef, useEffect } from 'react';
import { Send, Square, Trash2, Thermometer } from 'lucide-react';
import MessageList from './MessageList';
import { useChat } from '../hooks/useChat';

const EXAMPLE_QUESTIONS = [
  'Summarize the main topics in the documents',
  'What are the key findings?',
  'Explain the methodology used',
  'What are the conclusions?',
];

export default function ChatInterface({ sessionId, setSessionId, provider, model }) {
  const [input, setInput] = useState('');
  const [temperature, setTemperature] = useState(0.3);
  const [showTemp, setShowTemp] = useState(false);
  const textareaRef = useRef(null);

  const { messages, streaming, error, sendMessage, stopStreaming, clearMessages } = useChat(
    sessionId,
    setSessionId
  );

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || streaming) return;
    sendMessage(q, { provider, model, temperature });
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-interface">
      {/* Message area */}
      <div className="messages-area">
        <MessageList messages={messages} streaming={streaming} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          ⚠ {error}
        </div>
      )}

      {/* Example chips — show only when no messages */}
      {messages.length === 0 && (
        <div className="example-chips">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button key={q} className="example-chip" onClick={() => setInput(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="input-bar">
        <div className="input-row">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Ask anything about your documents…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={streaming}
          />

          <div className="input-actions">
            {/* Temperature toggle */}
            <button
              className={`icon-btn ${showTemp ? 'active' : ''}`}
              onClick={() => setShowTemp(s => !s)}
              title="Temperature"
            >
              <Thermometer size={16} />
            </button>

            {/* Clear */}
            {messages.length > 0 && !streaming && (
              <button className="icon-btn" onClick={clearMessages} title="Clear chat">
                <Trash2 size={16} />
              </button>
            )}

            {/* Send / Stop */}
            {streaming ? (
              <button className="send-btn stop" onClick={stopStreaming} title="Stop">
                <Square size={16} />
              </button>
            ) : (
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                title="Send (Enter)"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>

        {showTemp && (
          <div className="temp-row">
            <span className="temp-label">Temperature: {temperature.toFixed(1)}</span>
            <input
              type="range" min="0" max="1" step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="temp-slider"
            />
            <span className="temp-hint">0 = precise · 1 = creative</span>
          </div>
        )}

        <p className="input-footer">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      <style>{`
        .chat-interface { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .messages-area { flex: 1; overflow-y: auto; }
        .error-banner { margin: 0 16px 8px; padding: 8px 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); border-radius: 8px; font-size: 13px; color: var(--error); }
        .example-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 10px; }
        .example-chip { padding: 6px 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-secondary); font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .example-chip:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .input-bar { border-top: 1px solid var(--border); padding: 12px 16px; display: flex; flex-direction: column; gap: 6px; }
        .input-row { display: flex; gap: 8px; align-items: flex-end; }
        .chat-input {
          flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border);
          border-radius: 12px; padding: 10px 14px; color: var(--text-primary);
          font-size: 14px; outline: none; resize: none; font-family: inherit;
          line-height: 1.5; max-height: 160px; overflow-y: auto;
          transition: border-color 0.15s;
        }
        .chat-input:focus { border-color: var(--accent); }
        .chat-input:disabled { opacity: 0.6; }
        .input-actions { display: flex; align-items: center; gap: 4px; }
        .icon-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-tertiary); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; }
        .icon-btn:hover { border-color: var(--accent); color: var(--accent); }
        .icon-btn.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent); }
        .send-btn { width: 34px; height: 34px; border-radius: 8px; border: none; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.15s; }
        .send-btn:hover:not(:disabled) { background: var(--accent-hover); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn.stop { background: var(--error); }
        .send-btn.stop:hover { background: #dc2626; }
        .temp-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; }
        .temp-label { font-size: 12px; color: var(--text-secondary); min-width: 110px; }
        .temp-slider { flex: 1; accent-color: var(--accent); }
        .temp-hint { font-size: 11px; color: var(--text-muted); white-space: nowrap; }
        .input-footer { font-size: 11px; color: var(--text-muted); text-align: center; }
      `}</style>
    </div>
  );
}
