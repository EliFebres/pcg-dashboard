'use client';

import React from 'react';
import { X } from 'lucide-react';
import { useToasts, TOAST_DURATION_MS, ToastEntry } from '@/app/lib/hooks/useToasts';
import { renderAlertContent } from '@/app/components/dashboard/alertContent';

// z-[9998] sits just below the Radix popover (z-[9999]) so an open Bell
// popover overlays a toast, while still being above the sidebar/header.
export function ToastContainer() {
  const { toasts, dismiss } = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.key} toast={toast} onDismiss={() => dismiss(toast.key)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastEntry; onDismiss: () => void }) {
  const { Icon, accent, accentBg, title, infoLine, body } = renderAlertContent(toast.alert);

  return (
    <div className="toast-enter pointer-events-auto w-[400px] rounded-lg bg-zinc-900 border border-zinc-700/50 shadow-xl overflow-hidden">
      <div className="group relative px-4 py-3">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex-shrink-0 ${accent}`}>
            <Icon className="w-[1.1rem] h-[1.1rem]" />
          </div>
          <div className="flex-1 min-w-0 pr-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[0.715rem] font-semibold uppercase tracking-wider ${accent}`}>
                {title}
              </span>
            </div>
            <div className="text-[0.825rem] text-white mb-1 truncate">{infoLine}</div>
            <div className="text-[0.825rem] text-white leading-relaxed">{body}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          title="Dismiss"
          className="absolute top-3 right-3 p-0.5 rounded text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        className={`h-0.5 ${accentBg} toast-progress opacity-70`}
        style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
      />
    </div>
  );
}
