'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Link, ExternalLink, Trash2 } from 'lucide-react';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  label: string;
  ticker: string;
  tickerName: string;
  currentUrl: string;
  onSave: (ticker: string, url: string) => void;
  placeholder?: string;
}

// Outer wrapper keeps the body unmounted while closed — so each reopen is a
// fresh mount and state initializes lazily from the current prop snapshot.
const LinkModal: React.FC<LinkModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <LinkModalBody {...props} />;
};

const LinkModalBody: React.FC<LinkModalProps> = ({
  onClose,
  title,
  label,
  ticker,
  tickerName,
  currentUrl,
  onSave,
  placeholder = 'https://...',
}) => {
  const [url, setUrl] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount (i.e. when the modal opens)
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    onSave(ticker, url.trim());
    onClose();
  };

  const handleClear = () => {
    onSave(ticker, '');
    onClose();
  };

  const hasChanges = url.trim() !== currentUrl;
  const isValidUrl = !url.trim() || url.trim().startsWith('http://') || url.trim().startsWith('https://') || url.trim().startsWith('/');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/50 shadow-2xl">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-white">{title}</h2>
            <p className="text-xs text-muted mt-0.5">
              <span className="text-cyan-400 font-medium">{ticker}</span>
              <span className="text-muted mx-1">·</span>
              {tickerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="relative z-10 p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-2">
                {label}
              </label>
              <div className="relative">
                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-10 pr-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors"
                />
              </div>
              {url && !isValidUrl && (
                <p className="mt-2 text-xs text-red-400">
                  URL should start with http://, https://, or /
                </p>
              )}
            </div>

            {/* Preview */}
            {url.trim() && isValidUrl && (
              <div className="p-3 bg-zinc-800/30 border border-zinc-700/30">
                <p className="text-xs text-muted mb-2">Preview:</p>
                <a
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {url.trim().length > 50 ? url.trim().substring(0, 50) + '...' : url.trim()}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-5 py-4 border-t border-zinc-800/50 flex items-center justify-between">
          <div>
            {currentUrl && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove Link
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || !isValidUrl}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                hasChanges && isValidUrl
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400'
                  : 'bg-zinc-800 text-muted cursor-not-allowed'
              }`}
            >
              <Link className="w-4 h-4" />
              Save Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkModal;
