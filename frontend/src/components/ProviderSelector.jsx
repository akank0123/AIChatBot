import { useState, useEffect } from 'react';
import { getProviders } from '../services/providersApi';

const PROVIDER_ICONS = {
  openai: '🟢',
  gemini: '🔵',
  llama: '🦙',
};

const PROVIDER_LABELS = {
  openai: 'OpenAI GPT',
  gemini: 'Google Gemini',
  llama: 'Llama (Local)',
};

export default function ProviderSelector({ provider, model, onProviderChange, onModelChange }) {
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProviders()
      .then(setProviders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentModels = providers[provider]?.models || [];
  const isAvailable = providers[provider]?.available;

  return (
    <div className="provider-selector">
      <div className="selector-group">
        <label className="selector-label">Provider</label>
        <div className="provider-buttons">
          {loading ? (
            <span className="loading-dots">Loading…</span>
          ) : (
            Object.entries(PROVIDER_LABELS).map(([key, label]) => {
              const available = providers[key]?.available;
              return (
                <button
                  key={key}
                  className={`provider-btn ${provider === key ? 'active' : ''} ${!available ? 'unavailable' : ''}`}
                  onClick={() => available && onProviderChange(key)}
                  title={available ? label : `${label} — not configured`}
                  disabled={!available}
                >
                  {PROVIDER_ICONS[key]} {label}
                  {!available && <span className="badge-off">off</span>}
                </button>
              );
            })
          )}
        </div>
      </div>

      {currentModels.length > 0 && (
        <div className="selector-group">
          <label className="selector-label">Model</label>
          <select
            className="model-select"
            value={model || ''}
            onChange={e => onModelChange(e.target.value || null)}
          >
            <option value="">Default</option>
            {currentModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      <style>{`
        .provider-selector { display: flex; flex-direction: column; gap: 10px; }
        .selector-group { display: flex; flex-direction: column; gap: 6px; }
        .selector-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 600; }
        .provider-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
        .provider-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
          background: var(--bg-tertiary); color: var(--text-secondary);
          font-size: 12px; cursor: pointer; transition: all 0.15s;
          white-space: nowrap;
        }
        .provider-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--text-primary); }
        .provider-btn.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent); }
        .provider-btn.unavailable { opacity: 0.45; cursor: not-allowed; }
        .badge-off { font-size: 9px; background: var(--bg-secondary); border-radius: 4px; padding: 1px 4px; color: var(--text-muted); }
        .model-select {
          background: var(--bg-tertiary); border: 1px solid var(--border);
          color: var(--text-primary); border-radius: 8px; padding: 6px 10px;
          font-size: 12px; cursor: pointer; outline: none;
        }
        .model-select:focus { border-color: var(--accent); }
        .loading-dots { font-size: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
