// Message Sent + State Updated Instantly

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

      // Immediately creates two message objects: one user message and one empty assistant message
      const userMsg = { role: 'user', content: question, id: Date.now() };
      const aiMsg = { role: 'assistant', content: '', id: Date.now() + 1, sources: [] };
      // Adds both to messages state — user sees their question appear right away
      setMessages(prev => [...prev, userMsg, aiMsg]);


      // Calls streamChat(...) to open the streaming connection to the backend
      controllerRef.current = streamChat(
        { question, session_id: sessionId, provider, model, temperature },
        {
          // Saves the session ID returned by backend (for new sessions)
          onSession: (id) => {
            if (!sessionId) setSessionId(id);
          },
          // Every word/token received is appended to the empty assistant message — this is the typing effect
          onToken: (token) => {
            setMessages(prev =>
              prev.map(m =>
                m.id === aiMsg.id ? { ...m, content: m.content + token } : m
              )
            );
          },
          // Attaches source links to the assistant message when they arrive
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

  //Aaborts the fetch request mid-stream if user clicks Stop
  const stopStreaming = useCallback(() => {
    controllerRef.current?.abort();
    setStreaming(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, streaming, error, sendMessage, stopStreaming, clearMessages };
}
