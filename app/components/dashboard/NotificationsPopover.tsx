'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/app/components/ui/Popover';
import { renderAlertContent } from '@/app/components/dashboard/alertContent';
import type { Alert } from '@/app/lib/types/alerts';

const MAX_VISIBLE_ALERTS = 6;

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
  const listRef = useRef<HTMLDivElement>(null);
  const [maxListHeight, setMaxListHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    if (children.length <= MAX_VISIBLE_ALERTS) {
      setMaxListHeight(undefined);
      return;
    }
    const visibleHeight = children
      .slice(0, MAX_VISIBLE_ALERTS)
      .reduce((sum, child) => sum + child.offsetHeight, 0);
    setMaxListHeight(visibleHeight);
  }, [alerts]);

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
        className="w-[500px] flex flex-col rounded-lg"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 flex-shrink-0">
          <h3 className="text-[1.05rem] font-semibold text-white tracking-wide">Notifications</h3>
          <button
            type="button"
            onClick={onClearAll}
            disabled={alerts.length === 0}
            className="text-[0.9rem] font-medium text-white border-[0.5px] border-white/30 rounded-sm px-2.5 py-1 hover:bg-white/[0.08] hover:border-white/60 disabled:text-white/40 disabled:border-white/10 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          >
            Clear all
          </button>
        </div>
        <div
          ref={listRef}
          className="overflow-y-auto min-h-0"
          style={maxListHeight !== undefined ? { maxHeight: `${maxListHeight}px` } : undefined}
        >
          {alerts.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-white">
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
  const { Icon, accent, title, infoLine, body } = renderAlertContent(alert);

  return (
    <div className="group relative px-4 py-3 border-b border-zinc-800/40 hover:bg-white/[0.02] transition-colors">
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
          <div className="text-[0.825rem] text-white mb-1 truncate">
            {infoLine}
          </div>
          <div className="text-[0.825rem] text-white leading-relaxed">{body}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        title="Dismiss"
        className="absolute top-3 right-3 p-0.5 rounded text-white/70 hover:text-white hover:bg-white/[0.08] opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
