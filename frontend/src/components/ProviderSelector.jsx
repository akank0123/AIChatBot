import { useState, useEffect } from 'react';
import { getProviders } from '../services/providersApi';

const PROVIDER_META = {
  openai: { label: 'OpenAI GPT',     icon: '🟢' },
  gemini: { label: 'Google Gemini',  icon: '🔵' },
  llama:  { label: 'Llama (Local)',  icon: '🦙' },
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

  return (
    <div className="d-flex flex-column gap-2">
      {loading ? (
        <div className="d-flex align-items-center gap-2" style={{ color: 'var(--text-3)', fontSize: 13, padding: '6px 0' }}>
          <span className="spinner-ring spin" />
          Loading providers…
        </div>
      ) : (
        Object.entries(PROVIDER_META).map(([key, { label, icon }]) => {
          const available = providers[key]?.available;
          return (
            <button
              key={key}
              className={`provider-btn${provider === key ? ' active' : ''}`}
              onClick={() => available && onProviderChange(key)}
              disabled={!available}
              title={available ? label : `${label} — not configured`}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span style={{ flex: 1 }}>{label}</span>
              {!available && <span className="provider-badge-off">off</span>}
            </button>
          );
        })
      )}

      {currentModels.length > 0 && (
        <div className="mt-1">
          <p className="sidebar-section-label mb-1" style={{ marginTop: 6 }}>Model</p>
          <select
            className="model-select"
            value={model || ''}
            onChange={e => onModelChange(e.target.value || null)}
          >
            <option value="">Default model</option>
            {currentModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
