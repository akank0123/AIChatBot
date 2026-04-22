import { useState, useRef, useCallback } from 'react';
import { streamChat } from '../services/chatApi';

export function useChat(sessionId, setSessionId) {
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const sendMessage = useCallback(
    (question, { provider, model, temperature } = {}) => {
      if (streaming) return;
      setError(null);
      setStreaming(true);

      const userMsg = { role: 'user', content: question, id: Date.now() };
      const aiMsg = { role: 'assistant', content: '', id: Date.now() + 1, sources: [] };
      setMessages(prev => [...prev, userMsg, aiMsg]);

      controllerRef.current = streamChat(
        { question, session_id: sessionId, provider, model, temperature },
        {
          onSession: (id) => {
            if (!sessionId) setSessionId(id);
          },
          onToken: (token) => {
            setMessages(prev =>
              prev.map(m =>
                m.id === aiMsg.id ? { ...m, content: m.content + token } : m
              )
            );
          },
          onSources: (sources) => {
            setMessages(prev =>
              prev.map(m => (m.id === aiMsg.id ? { ...m, sources } : m))
            );
          },
          onDone: () => setStreaming(false),
          onError: (msg) => {
            setError(msg);
            setStreaming(false);
            setMessages(prev =>
              prev.map(m =>
                m.id === aiMsg.id
                  ? { ...m, content: m.content || `Error: ${msg}`, isError: true }
                  : m
              )
            );
          },
        }
      );
    },
    [sessionId, streaming, setSessionId]
  );

  const stopStreaming = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, streaming, error, sendMessage, stopStreaming, clearMessages };
}
