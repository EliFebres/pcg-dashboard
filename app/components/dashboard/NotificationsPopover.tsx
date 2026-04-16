'use client';

import React from 'react';
import { Clock, FileText, UserPlus, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/app/components/ui/Popover';
import type { Alert } from '@/app/lib/types/alerts';

interface NotificationsPopoverProps {
  alerts: Alert[];
  onDismiss: (alert: Alert) => void;
  onClearAll: () => void;
  onOpen?: () => void;
  children: React.ReactNode;
}

export function NotificationsPopover({
  alerts,
  onDismiss,
  onClearAll,
  onOpen,
  children,
}: NotificationsPopoverProps) {
  return (
    <Popover
      onOpenChange={(open) => {
        if (open) onOpen?.();
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        alignOffset={50}
        side="right"
        sideOffset={-30}
        className="w-[500px] max-h-[600px] flex flex-col rounded-lg"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <h3 className="text-[1.05rem] font-semibold text-zinc-100 tracking-wide">Notifications</h3>
          <button
            type="button"
            onClick={onClearAll}
            disabled={alerts.length === 0}
            className="text-[0.9rem] font-medium text-zinc-400 hover:text-zinc-100 disabled:text-zinc-600 disabled:hover:text-zinc-600 disabled:cursor-not-allowed transition-colors"
          >
            Clear all
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {alerts.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-zinc-500">
              You&apos;re all caught up.
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onDismiss={() => onDismiss(alert)} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AlertRow({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const eng = alert.engagement;

  const { Icon, accent, title } =
    alert.type === 'follow-up-stale'
      ? { Icon: Clock, accent: 'text-amber-400', title: 'Stale Follow-Up' }
      : alert.type === 'assigned'
      ? { Icon: UserPlus, accent: 'text-cyan-400', title: 'Assigned to Project' }
      : { Icon: FileText, accent: 'text-blue-400', title: 'New Note' };

  let body: React.ReactNode;
  if (alert.type === 'follow-up-stale') {
    body = (
      <>
        This project has been in <span className="text-amber-400 font-medium">Follow Up</span>{' '}
        since {eng.dateStarted}. Reach out to{' '}
        <span className="text-zinc-100 font-medium">{eng.internalClient.name}</span> to ask if
        there have been any NNA winnings from the client.
      </>
    );
  } else if (alert.type === 'assigned') {
    body = (
      <>
        <span className="text-zinc-100 font-medium">{eng.createdByName ?? 'Someone'}</span> added
        you to this project.
      </>
    );
  } else {
    body = (
      <>
        <span className="text-zinc-100 font-medium">{alert.note?.authorName}</span> added a note:{' '}
        <span className="text-zinc-400 italic">&ldquo;{alert.note?.noteText}&rdquo;</span>
      </>
    );
  }

  return (
    <div className="group relative px-4 py-3 border-b border-zinc-800/40 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex-shrink-0 ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 pr-5">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[0.65rem] font-semibold uppercase tracking-wider ${accent}`}>
              {title}
            </span>
          </div>
          <div className="text-xs text-zinc-300 mb-1 truncate">
            <span className="font-medium">{eng.type}</span>
            {eng.externalClient && (
              <span className="text-zinc-500"> · {eng.externalClient}</span>
            )}
            <span className="text-zinc-500"> · {eng.internalClient.name}</span>
          </div>
          <div className="text-xs text-zinc-400 leading-relaxed">{body}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        title="Dismiss"
        className="absolute top-3 right-3 p-0.5 rounded text-zinc-600 hover:text-zinc-200 hover:bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
