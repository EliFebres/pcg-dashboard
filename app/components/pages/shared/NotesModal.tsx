'use client';

import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { getEngagementNotes, addEngagementNote } from '@/app/lib/api/client-interactions';
import type { NoteEntry } from '@/app/lib/types/engagements';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: ReactNode;
  engagementId: number;
  onNoteAdded?: () => void;
}

function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  engagementId,
  onNoteAdded,
}) => {
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch notes when modal opens
  useEffect(() => {
    if (!isOpen || !engagementId) return;
    setLoading(true);
    setNewText('');
    getEngagementNotes(engagementId)
      .then(setNotes)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, engagementId]);

  // Focus textarea when modal opens (after load)
  useEffect(() => {
    if (isOpen && !loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, loading]);

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAddNote = async () => {
    if (!newText.trim() || saving) return;
    setSaving(true);
    try {
      const entry = await addEngagementNote(engagementId, newText.trim());
      setNotes(prev => [entry, ...prev]);
      setNewText('');
      onNoteAdded?.();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd+Enter submits
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAddNote();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/50 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-medium text-white">{title}</h2>
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Note history */}
        <div className="relative z-10 flex-1 overflow-y-auto min-h-0 p-5 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-8">No notes yet. Add the first one below.</p>
          ) : (
            notes.map(entry => (
              <div
                key={entry.id}
                className="bg-zinc-800/50 border border-zinc-700/40 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-cyan-400">{entry.authorName}</span>
                  <span className="text-zinc-600 text-xs">·</span>
                  <span className="text-xs text-zinc-500">{formatNoteDate(entry.createdAt)}</span>
                </div>
                <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{entry.noteText}</p>
              </div>
            ))
          )}
        </div>

        {/* Add new note */}
        <div className="relative z-10 px-5 pt-3 pb-5 border-t border-zinc-800/50 flex-shrink-0 space-y-3">
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new note... (Ctrl+Enter to save)"
            rows={4}
            className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 text-sm text-white placeholder-zinc-500 resize-y focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors"
          />
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newText.trim() || saving}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                newText.trim() && !saving
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
