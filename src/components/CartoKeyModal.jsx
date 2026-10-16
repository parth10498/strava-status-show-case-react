import React, { useState } from 'react';
import { Key, ExternalLink, X, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { getCartoApiKey, setCartoApiKey } from '../utils/mapTileService';

export default function CartoKeyModal({ isOpen, onClose, onKeySaved }) {
  const [keyInput, setKeyInput] = useState(getCartoApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setCartoApiKey(keyInput);
    setSavedSuccess(true);
    if (onKeySaved) onKeySaved(keyInput.trim());
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleRemove = () => {
    setCartoApiKey('');
    setKeyInput('');
    if (onKeySaved) onKeySaved('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1300 }}>
      <div 
        className="glass-card carto-key-modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%',
          maxWidth: '520px',
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(252, 82, 0, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(252, 82, 0, 0.2)',
          borderRadius: '16px',
          color: 'var(--text-main)',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '10px', 
              background: 'rgba(252, 82, 0, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Key size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>CARTO Basemaps API Key</h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Remove "API KEY REQUIRED" Watermarks</span>
            </div>
          </div>
          <button 
            className="icon-btn" 
            onClick={onClose}
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.04)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: '10px', 
          padding: '12px 14px', 
          marginBottom: '16px',
          fontSize: '0.82rem',
          lineHeight: '1.45',
          color: 'var(--text-muted)'
        }}>
          <p style={{ margin: '0 0 8px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} style={{ color: '#F59E0B' }} />
            <strong>Why do tiles show a watermark?</strong>
          </p>
          CARTO now requires a free API key for direct requests to <em>Dark Matter</em> and <em>Voyager</em>. 
          Without a key, CARTO stamps a diagonal <code>API KEY REQUIRED</code> watermark.
        </div>

        <div style={{ 
          background: 'rgba(16, 185, 129, 0.08)', 
          border: '1px solid rgba(16, 185, 129, 0.25)', 
          borderRadius: '10px', 
          padding: '12px 14px', 
          marginBottom: '18px',
          fontSize: '0.82rem'
        }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#34D399', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> How to get a Free Key (Takes 30 seconds):
          </p>
          <ol style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-main)' }}>
            <li>Visit <a href="https://carto.com/basemaps/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#6EE7B7', fontWeight: 600, textDecoration: 'underline' }}>carto.com/basemaps/apikey <ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></a></li>
            <li>Enter your email address to generate an instant free key.</li>
            <li>Paste your key below and click <strong>Save & Apply</strong>.</li>
          </ol>
        </div>

        <form onSubmit={handleSave}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Your CARTO API Key:
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input 
              type="text"
              placeholder="Paste your key here (e.g. carto_live_...)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={{
                flex: 1,
                background: '#0B0F19',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'white',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
            {keyInput && (
              <button
                type="button"
                onClick={handleRemove}
                title="Clear Key"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#EF4444',
                  borderRadius: '8px',
                  padding: '0 12px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="carto-modal-footer">
            <span className="carto-modal-tip">
              Tip: Or use <strong>Midnight Dark</strong> (100% free, no key needed).
            </span>
            <div className="carto-modal-buttons">
              <button 
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn"
                style={{
                  background: savedSuccess ? '#10B981' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {savedSuccess ? <><Check size={16} /> Saved!</> : 'Save & Apply'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
