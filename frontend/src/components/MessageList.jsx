import { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Bot } from 'lucide-react';

export default function MessageList({ messages, streaming }) {
  const bottomRef = useRef(null);

  // Auto-scrolls to the bottom every time messages changes (every token = scroll)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Bot size={40} /></div>
        <h2 className="empty-title">RAG Knowledge Chatbot</h2>
        <p className="empty-sub">
          Upload documents, paste URLs, or add text to the knowledge base —
          then ask anything about your content.
        </p>
        <div className="empty-hints">
          <span className="hint-chip">📄 PDF documents</span>
          <span className="hint-chip">🌐 Live websites</span>
          <span className="hint-chip">📝 Plain text</span>
          <span className="hint-chip">🤖 3 AI providers</span>
        </div>
        <style>{`
          .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px 20px; text-align: center; color: var(--text-muted); }
          .empty-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--accent-light); border: 1px solid var(--accent); display: flex; align-items: center; justify-content: center; color: var(--accent); }
          .empty-title { font-size: 22px; font-weight: 700; color: var(--text-primary); }
          .empty-sub { font-size: 14px; max-width: 420px; line-height: 1.6; }
          .empty-hints { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 4px; }
          .hint-chip { padding: 5px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 20px; font-size: 13px; color: var(--text-secondary); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="message-list">
      {/* Renders each message through MessageItem */}
      {messages.map((msg, i) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isLast={i === messages.length - 1}
          streaming={streaming}
        />
      ))}
      <div ref={bottomRef} />
      <style>{`
        .message-list { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
      `}</style>
    </div>
  );
}
