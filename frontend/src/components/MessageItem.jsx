import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, ExternalLink } from 'lucide-react';

export default function MessageItem({ message, isLast, streaming }) {
  const isUser = message.role === 'user';
  const isStreaming = isLast && streaming && !isUser;

  return (
    <div className={`message-row${isUser ? ' user' : ''}`}>
      <div className="msg-avatar">
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className="bubble-wrap">
        <div className={`bubble${isUser ? ' user-bubble' : ' ai-bubble'}${message.isError ? ' error-bubble' : ''}`}>
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
    </div>
  );
}
