import { useState, useRef } from 'react';
import { uploadFile, ingestURL, ingestText, clearKnowledgeBase } from '../services/documentsApi';
import { Upload, Link, FileText, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const TABS = [
  { id: 'file', label: 'File', icon: Upload },
  { id: 'url',  label: 'URL',  icon: Link },
  { id: 'text', label: 'Text', icon: FileText },
];

export default function DocumentUploader({ onIngested, sessionId }) {
  const [tab, setTab] = useState('file');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState(null);
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
    setLoading(true); setProgress(0);
    try {
      const res = await uploadFile(file, sessionId, setProgress);
      showStatus('success', res.message, { name: file.name, chunks: res.chunks, type: 'file' });
      onIngested?.();
      fileRef.current.value = '';
    } catch (err) {
      showStatus('error', err.response?.data?.error || err.message);
    } finally { setLoading(false); setProgress(0); }
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
      const res = await ingestURL(url.trim(), sessionId);
      showStatus('success', res.message, { name: url, chunks: res.chunks, type: 'url' });
      onIngested?.(); setUrl('');
    } catch (err) {
      showStatus('error', err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  };

  const handleText = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await ingestText(text.trim(), sessionId);
      showStatus('success', res.message, { name: 'Pasted text', chunks: res.chunks, type: 'text' });
      onIngested?.(); setText('');
    } catch (err) {
      showStatus('error', err.response?.data?.error || err.message);
    } finally { setLoading(false); }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear the entire knowledge base?')) return;
    try {
      await clearKnowledgeBase(sessionId);
      setIngestedDocs([]);
      showStatus('success', 'Knowledge base cleared');
    } catch (err) {
      showStatus('error', err.message);
    }
  };

  return (
    <div className="d-flex flex-column" style={{ gap: 0 }}>
      {/* Header */}
      <div className="uploader-header">
        <span className="uploader-title">Knowledge Base</span>
        {ingestedDocs.length > 0 && (
          <button className="clear-kb-btn" onClick={handleClear} title="Clear knowledge base">
            <Trash2 size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Tab strip */}
      <ul className="nav nav-tabs mb-3">
        {TABS.map(({ id, label, icon: Icon }) => (
          <li className="nav-item" key={id}>
            <button
              className={`nav-link d-flex align-items-center gap-1${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
              type="button"
            >
              <Icon size={11} /> {label}
            </button>
          </li>
        ))}
      </ul>

      {/* File tab */}
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
            <div className="d-flex flex-column align-items-center gap-2">
              <Loader size={22} className="spin" style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {progress > 0 ? `Uploading… ${progress}%` : 'Processing…'}
              </span>
            </div>
          ) : (
            <>
              <Upload size={22} />
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
                Drop a file or click to browse
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                PDF · TXT · MD · CSV · up to 50 MB
              </span>
            </>
          )}
        </div>
      )}

      {/* URL tab */}
      {tab === 'url' && (
        <div className="d-flex gap-2">
          <input
            className="form-control form-control-sm"
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleURL()}
            style={{ fontSize: 13 }}
          />
          <button className="ingest-btn" onClick={handleURL} disabled={loading || !url.trim()}>
            {loading ? <Loader size={13} className="spin" /> : 'Ingest'}
          </button>
        </div>
      )}

      {/* Text tab */}
      {tab === 'text' && (
        <div className="d-flex flex-column gap-2">
          <textarea
            className="form-control form-control-sm"
            placeholder="Paste your text here…"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            style={{ fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <button className="ingest-btn" onClick={handleText} disabled={loading || !text.trim()}>
            {loading ? <Loader size={13} className="spin" /> : 'Ingest text'}
          </button>
        </div>
      )}

      {/* Status message */}
      {status && (
        <div className={`status-msg ${status.type}`}>
          {status.type === 'success'
            ? <CheckCircle size={13} style={{ flexShrink: 0 }} />
            : <AlertCircle size={13} style={{ flexShrink: 0 }} />
          }
          {status.message}
        </div>
      )}

      {/* Ingested docs */}
      {ingestedDocs.length > 0 && (
        <div className="doc-list">
          {ingestedDocs.map((doc, i) => (
            <div key={i} className="doc-item">
              <span style={{ fontSize: 14 }}>
                {doc.type === 'file' ? '📄' : doc.type === 'url' ? '🌐' : '📝'}
              </span>
              <span className="doc-name" title={doc.name}>{doc.name}</span>
              <span className="doc-chunks">{doc.chunks} chunks</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
