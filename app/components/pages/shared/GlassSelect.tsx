'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  hasError?: boolean;
  /** Render the dropdown with position:fixed so it escapes overflow:hidden/auto parents (e.g. table wrappers) */
  menuFixed?: boolean;
}

export default function GlassSelect({ value, onChange, options, placeholder = 'Select...', hasError, menuFixed }: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleOpen() {
    if (menuFixed && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen(v => !v);
  }

  const borderClass = hasError
    ? 'border-red-500/50 focus-within:border-red-500/50'
    : 'border-zinc-700/50 focus-within:border-cyan-500/50';

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-zinc-800/40 backdrop-blur-sm border rounded-lg text-sm transition-colors focus:outline-none focus:ring-1 ${hasError ? 'focus:ring-red-500/20' : 'focus:ring-cyan-500/30'} ${borderClass} ${value ? 'text-zinc-100' : 'text-zinc-500'}`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          style={menuFixed ? menuStyle : undefined}
          className={`${menuFixed ? 'fixed z-[9999]' : 'absolute z-50 mt-1 w-full'} bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-lg shadow-xl overflow-hidden`}
        >
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === opt
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-zinc-200 hover:bg-white/[0.06]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
