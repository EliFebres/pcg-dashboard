'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign } from 'lucide-react';

interface NNAModalProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: number;
  externalClient: string | null;
  internalClient: string;
  currentNNA: number | undefined;
  onSave: (engagementId: number, nna: number | undefined) => void;
}

const NNAModal: React.FC<NNAModalProps> = ({
  isOpen,
  onClose,
  engagementId,
  externalClient,
  internalClient,
  currentNNA,
  onSave,
}) => {
  const [nnaValue, setNnaValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      // Format current NNA for display
      if (currentNNA) {
        setNnaValue(formatForInput(currentNNA));
      } else {
        setNnaValue('');
      }
    }
  }, [isOpen, currentNNA]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Format number for input display (e.g., 50000000 -> "50,000,000")
  const formatForInput = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  // Parse input string to number (handles commas, M, B suffixes)
  const parseNNAInput = (input: string): number | undefined => {
    if (!input.trim()) return undefined;

    // Remove commas and spaces
    let cleaned = input.replace(/,/g, '').replace(/\s/g, '').toUpperCase();

    // Remove leading $ if present
    if (cleaned.startsWith('$')) {
      cleaned = cleaned.substring(1);
    }

    // Handle M (millions) and B (billions) suffixes
    let multiplier = 1;
    if (cleaned.endsWith('M')) {
      multiplier = 1_000_000;
      cleaned = cleaned.slice(0, -1);
    } else if (cleaned.endsWith('B')) {
      multiplier = 1_000_000_000;
      cleaned = cleaned.slice(0, -1);
    } else if (cleaned.endsWith('K')) {
      multiplier = 1_000;
      cleaned = cleaned.slice(0, -1);
    }

    const num = parseFloat(cleaned);
    if (isNaN(num)) return undefined;

    return Math.round(num * multiplier);
  };

  // Format NNA for display
  const formatNNADisplay = (value: number | undefined): string => {
    if (!value || value === 0) return '—';
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    } else if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const handleSave = () => {
    const parsedValue = parseNNAInput(nnaValue);
    onSave(engagementId, parsedValue);
    onClose();
  };

  const handleClear = () => {
    onSave(engagementId, undefined);
    onClose();
  };

  const parsedPreview = parseNNAInput(nnaValue);
  const hasChanges = parsedPreview !== currentNNA;
  const clientDisplay = externalClient || internalClient;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/50 shadow-2xl">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-white">Net New Assets</h2>
            <p className="text-xs text-muted mt-0.5">{clientDisplay}</p>
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
                Enter NNA Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={nnaValue}
                  onChange={(e) => setNnaValue(e.target.value)}
                  placeholder="e.g., 50M, 1.5B, 500000"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors font-mono"
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                Supports formats: 50M, 1.5B, 500K, or exact numbers like 50,000,000
              </p>
            </div>

            {/* Preview */}
            {nnaValue && (
              <div className="p-3 bg-zinc-800/30 border border-zinc-700/30">
                <p className="text-xs text-muted mb-1">Preview:</p>
                <p className={`text-lg font-mono ${parsedPreview ? 'text-emerald-400' : 'text-red-400'}`}>
                  {parsedPreview ? formatNNADisplay(parsedPreview) : 'Invalid format'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-5 py-4 border-t border-zinc-800/50 flex items-center justify-between">
          <div>
            {currentNNA && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                Clear NNA
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
              disabled={!hasChanges || (!!nnaValue && !parsedPreview)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                hasChanges && (!nnaValue || parsedPreview)
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-500 text-white hover:from-emerald-500 hover:to-cyan-400'
                  : 'bg-zinc-800 text-muted cursor-not-allowed'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Save NNA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NNAModal;
