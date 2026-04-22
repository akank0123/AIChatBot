import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, ExternalLink } from 'lucide-react';

export default function MessageItem({ message, isLast, streaming }) {
  const isUser = message.role === 'user';
  const isStreaming = isLast && streaming && !isUser;

  return (
    <div className={`message-row ${isUser ? 'user' : 'ai'}`}>
      <div className="avatar">
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className="bubble-wrap">
        <div className={`bubble ${isUser ? 'user-bubble' : 'ai-bubble'} ${message.isError ? 'error-bubble' : ''}`}>
          {isUser ? (
            <p className="user-text">{message.content}</p>
          ) : (
            <div className="ai-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content || (isStreaming ? '' : '…')}
              </ReactMarkdown>
              {isStreaming && <span className="cursor" />}
            </div>
          )}
        </div>

        {!isUser && message.sources?.length > 0 && (
          <div className="sources">
            <span className="sources-label">Sources:</span>
            {message.sources.map((src, i) => (
              <a
                key={i}
                href={src.startsWith('http') ? src : undefined}
                target="_blank"
                rel="noreferrer"
                className="source-chip"
                title={src}
              >
                {src.startsWith('http') && <ExternalLink size={10} />}
                {src.length > 40 ? '…' + src.slice(-36) : src}
              </a>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .message-row { display: flex; gap: 10px; align-items: flex-start; padding: 4px 0; }
        .message-row.user { flex-direction: row-reverse; }
        .avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-tertiary); color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .message-row.user .avatar { background: var(--user-bubble); color: white; border-color: var(--user-bubble); }
        .bubble-wrap { display: flex; flex-direction: column; gap: 4px; max-width: 80%; }
        .message-row.user .bubble-wrap { align-items: flex-end; }
        .bubble { padding: 10px 14px; border-radius: 14px; line-height: 1.6; font-size: 14px; }
        .user-bubble { background: var(--user-bubble); color: white; border-radius: 14px 14px 4px 14px; }
        .ai-bubble { background: var(--ai-bubble); border: 1px solid var(--border); border-radius: 14px 14px 14px 4px; color: var(--text-primary); }
        .error-bubble { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3); color: var(--error); }
        .user-text { white-space: pre-wrap; word-break: break-word; }
        .ai-markdown { line-height: 1.7; }
        .ai-markdown p { margin: 0 0 10px; }
        .ai-markdown p:last-child { margin-bottom: 0; }
        .ai-markdown pre { background: var(--bg-primary); border-radius: 8px; padding: 12px 14px; overflow-x: auto; margin: 10px 0; border: 1px solid var(--border); }
        .ai-markdown code { font-family: 'Fira Code', 'Consolas', monospace; font-size: 13px; }
        .ai-markdown :not(pre) > code { background: var(--bg-primary); padding: 2px 6px; border-radius: 4px; font-size: 12px; border: 1px solid var(--border); }
        .ai-markdown ul { padding-left: 18px; margin: 6px 0 10px; list-style: disc; }
        .ai-markdown ol { padding-left: 18px; margin: 6px 0 10px; }
        .ai-markdown li { margin-bottom: 5px; line-height: 1.65; }
        .ai-markdown li > ul, .ai-markdown li > ol { margin: 4px 0 2px; }
        .ai-markdown h1 { font-size: 18px; font-weight: 700; margin: 16px 0 8px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 4px; }
        .ai-markdown h2 { font-size: 16px; font-weight: 700; margin: 14px 0 6px; color: var(--text-primary); }
        .ai-markdown h3 { font-size: 14px; font-weight: 600; margin: 12px 0 5px; color: var(--accent); }
        .ai-markdown strong { color: var(--text-primary); font-weight: 600; }
        .ai-markdown em { color: var(--text-secondary); }
        .ai-markdown blockquote { border-left: 3px solid var(--accent); padding: 4px 12px; color: var(--text-secondary); margin: 8px 0; background: var(--bg-tertiary); border-radius: 0 6px 6px 0; }
        .ai-markdown hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
        .ai-markdown table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 13px; }
        .ai-markdown th { background: var(--bg-tertiary); font-weight: 600; text-align: left; }
        .ai-markdown th, .ai-markdown td { border: 1px solid var(--border); padding: 7px 12px; }
        .ai-markdown tr:nth-child(even) td { background: var(--bg-secondary); }
        .cursor { display: inline-block; width: 2px; height: 1em; background: var(--accent); margin-left: 2px; vertical-align: text-bottom; animation: blink 0.9s step-start infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .sources { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
        .sources-label { font-size: 11px; color: var(--text-muted); }
        .source-chip { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; padding: 2px 8px; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 20px; color: var(--text-secondary); text-decoration: none; }
        .source-chip:hover { border-color: var(--accent); color: var(--accent); }
      `}</style>
    </div>
  );
}
