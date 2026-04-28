import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Bot } from 'lucide-react';

export default function MessageList({ messages, streaming }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        {/* Glow orb behind icon */}
        <div className="empty-icon-glow">
          <div className="empty-icon">
            <Bot size={34} />
          </div>
        </div>

        <h2 className="empty-title">RAG Knowledge Chatbot</h2>

        <p className="empty-sub">
          Upload documents, paste URLs, or add text to the knowledge base —
          then ask anything about your content.
        </p>

        <div className="hint-chips">
          <span className="hint-chip">📄 PDF documents</span>
          <span className="hint-chip">🌐 Live websites</span>
          <span className="hint-chip">📝 Plain text</span>
          <span className="hint-chip">🤖 3 AI providers</span>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg, i) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isLast={i === messages.length - 1}
          streaming={streaming}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
