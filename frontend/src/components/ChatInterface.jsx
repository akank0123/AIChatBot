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
        <div className="error-banner">⚠ {error}</div>
      )}

      {/* Example chips — only when empty */}
      {messages.length === 0 && (
        <div className="example-chips">
          {EXAMPLE_QUESTIONS.map(q => (
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
            <button
              className={`icon-btn${showTemp ? ' active' : ''}`}
              onClick={() => setShowTemp(s => !s)}
              title="Temperature"
            >
              <Thermometer size={15} />
            </button>

            {messages.length > 0 && !streaming && (
              <button className="icon-btn" onClick={clearMessages} title="Clear chat">
                <Trash2 size={15} />
              </button>
            )}

            {streaming ? (
              <button className="send-btn stop" onClick={stopStreaming} title="Stop generation">
                <Square size={15} />
              </button>
            ) : (
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                title="Send (Enter)"
              >
                <Send size={15} />
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

        <p className="input-footer">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
