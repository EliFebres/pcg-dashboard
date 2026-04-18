'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { X, Save } from 'lucide-react';

interface SimpleNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: ReactNode;
  currentNotes: string;
  onSave: (notes: string) => void;
  placeholder?: string;
}

const SimpleNotesModal: React.FC<SimpleNotesModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  currentNotes,
  onSave,
  placeholder = 'Add notes...',
}) => {
  const [notes, setNotes] = useState(currentNotes);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) setNotes(currentNotes);
  }, [isOpen, currentNotes]);

  useEffect(() => {
    if (isOpen && textareaRef.current) textareaRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = () => {
    onSave(notes);
    onClose();
  };

  const hasChanges = notes !== currentNotes;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="relative z-10 px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-white">{title}</h2>
            <p className="text-xs text-muted mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="relative z-10 p-5">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={placeholder}
            className="w-full h-48 px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 text-sm text-white placeholder-zinc-500 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div className="relative z-10 px-5 py-4 border-t border-zinc-800/50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-white transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400'
                : 'bg-zinc-800 text-muted cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleNotesModal;
