// The Streaming HTTP Connection

const BASE = '/api';

export function streamChat({ question, session_id, provider, model, temperature = 0.3 }, callbacks) {
  const { onToken, onDone, onError, onSources, onSession } = callbacks;
  const controller = new AbortController();
  // Sends POST /api/chat with { question, session_id, provider, model, temperature }
  fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id, provider, model, temperature }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        onError?.(err.error || 'Request failed');
        return;
      }

      const reader = res.body.getReader(); // Gets a stream reader from the response body instead of waiting for the full response
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();

        for (const part of parts) {
          const lines = part.split('\n');
          let eventType = 'message';
          let data = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: '))  data = line.slice(6);
          }

          if (!data) continue;

          if (eventType === 'token') {
            try { onToken?.(JSON.parse(data).token); } catch { onToken?.(data); }
          } else if (eventType === 'done') {
            onDone?.();
          } else if (eventType === 'error') {
            try { onError?.(JSON.parse(data).message); } catch { onError?.(data); }
          } else if (eventType === 'sources') {
            try { onSources?.(JSON.parse(data).sources); } catch {}
          } else if (eventType === 'session') {
            try { onSession?.(JSON.parse(data).session_id); } catch {}
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError?.(err.message);
    });

  return controller;
}
