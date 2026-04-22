import { useState, useRef } from 'react';
import { uploadFile, ingestURL, ingestText, clearKnowledgeBase } from '../services/documentsApi';
import { Upload, Link, FileText, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const TABS = [
  { id: 'file', label: 'File', icon: Upload },
  { id: 'url', label: 'URL', icon: Link },
  { id: 'text', label: 'Text', icon: FileText },
];

export default function DocumentUploader({ onIngested }) {
  const [tab, setTab] = useState('file');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null); // {type: 'success'|'error', message}
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ingestedDocs, setIngestedDocs] = useState([]);
  const fileRef = useRef();

  const showStatus = (type, message, doc = null) => {
    setStatus({ type, message });
    if (doc) setIngestedDocs(prev => [...prev, doc]);
    setTimeout(() => setStatus(null), 4000);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      const res = await uploadFile(file, setProgress);
      showStatus('success', res.message, { name: file.name, chunks: res.chunks, type: 'file' });
      onIngested?.();
      fileRef.current.value = '';
    } catch (err) {
      showStatus('error', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileRef.current.files = dt.files;
      handleFile({ target: fileRef.current });
    }
  };

  const handleURL = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await ingestURL(url.trim());
      showStatus('success', res.message, { name: url, chunks: res.chunks, type: 'url' });
      onIngested?.();
      setUrl('');
    } catch (err) {
      showStatus('error', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await ingestText(text.trim());
      showStatus('success', res.message, { name: 'Pasted text', chunks: res.chunks, type: 'text' });
      onIngested?.();
      setText('');
    } catch (err) {
      showStatus('error', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear the entire knowledge base?')) return;
    try {
      await clearKnowledgeBase();
      setIngestedDocs([]);
      showStatus('success', 'Knowledge base cleared');
    } catch (err) {
      showStatus('error', err.message);
    }
  };

  return (
    <div className="doc-uploader">
      <div className="uploader-header">
        <span className="uploader-title">Knowledge Base</span>
        {ingestedDocs.length > 0 && (
          <button className="clear-btn" onClick={handleClear} title="Clear knowledge base">
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`tab-btn ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {tab === 'file' && (
          <div
            className="drop-zone"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.csv"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
            {loading ? (
              <div className="drop-loading">
                <Loader size={20} className="spin" />
                <span>{progress > 0 ? `${progress}%` : 'Processing…'}</span>
              </div>
            ) : (
              <>
                <Upload size={22} />
                <span className="drop-text">Drop a file or click to browse</span>
                <span className="drop-hint">PDF, TXT, MD, CSV — up to 50 MB</span>
              </>
            )}
          </div>
        )}

        {tab === 'url' && (
          <div className="input-row">
            <input
              className="text-input"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleURL()}
            />
            <button className="ingest-btn" onClick={handleURL} disabled={loading || !url.trim()}>
              {loading ? <Loader size={14} className="spin" /> : 'Ingest'}
            </button>
          </div>
        )}

        {tab === 'text' && (
          <div className="text-tab">
            <textarea
              className="text-area"
              placeholder="Paste your text here…"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={5}
            />
            <button className="ingest-btn" onClick={handleText} disabled={loading || !text.trim()}>
              {loading ? <Loader size={14} className="spin" /> : 'Ingest'}
            </button>
          </div>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className={`status-msg ${status.type}`}>
          {status.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
          {status.message}
        </div>
      )}

      {/* Ingested docs list */}
      {ingestedDocs.length > 0 && (
        <div className="doc-list">
          {ingestedDocs.map((doc, i) => (
            <div key={i} className="doc-item">
              <span className="doc-type">{doc.type === 'file' ? '📄' : doc.type === 'url' ? '🌐' : '📝'}</span>
              <span className="doc-name" title={doc.name}>{doc.name}</span>
              <span className="doc-chunks">{doc.chunks} chunks</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .doc-uploader { display: flex; flex-direction: column; gap: 10px; }
        .uploader-header { display: flex; align-items: center; justify-content: space-between; }
        .uploader-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.06em; }
        .clear-btn { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--error); background: none; border: none; cursor: pointer; opacity: 0.7; }
        .clear-btn:hover { opacity: 1; }
        .tab-row { display: flex; gap: 4px; }
        .tab-btn { display: flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 6px; border: 1px solid transparent; background: none; color: var(--text-muted); font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .tab-btn:hover { color: var(--text-primary); }
        .tab-btn.active { background: var(--accent-light); border-color: var(--accent); color: var(--accent); }
        .tab-content { display: flex; flex-direction: column; gap: 8px; }
        .drop-zone {
          border: 1.5px dashed var(--border); border-radius: 10px;
          padding: 24px 16px; display: flex; flex-direction: column;
          align-items: center; gap: 6px; cursor: pointer;
          color: var(--text-muted); transition: all 0.15s;
        }
        .drop-zone:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .drop-text { font-size: 13px; color: var(--text-secondary); }
        .drop-hint { font-size: 11px; color: var(--text-muted); }
        .drop-loading { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .input-row { display: flex; gap: 6px; }
        .text-input { flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; color: var(--text-primary); font-size: 13px; outline: none; }
        .text-input:focus { border-color: var(--accent); }
        .text-tab { display: flex; flex-direction: column; gap: 6px; }
        .text-area { background: var(--bg-tertiary); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; color: var(--text-primary); font-size: 13px; outline: none; resize: vertical; font-family: inherit; }
        .text-area:focus { border-color: var(--accent); }
        .ingest-btn { padding: 8px 14px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 13px; cursor: pointer; font-weight: 500; transition: background 0.15s; display: flex; align-items: center; gap: 4px; }
        .ingest-btn:hover:not(:disabled) { background: var(--accent-hover); }
        .ingest-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .status-msg { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 8px; font-size: 12px; }
        .status-msg.success { background: rgba(34,197,94,0.12); color: var(--success); border: 1px solid rgba(34,197,94,0.2); }
        .status-msg.error { background: rgba(239,68,68,0.12); color: var(--error); border: 1px solid rgba(239,68,68,0.2); }
        .doc-list { display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto; }
        .doc-item { display: flex; align-items: center; gap: 6px; padding: 5px 8px; background: var(--bg-tertiary); border-radius: 6px; font-size: 12px; }
        .doc-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary); }
        .doc-chunks { font-size: 10px; color: var(--text-muted); white-space: nowrap; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
