'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Alert } from '@/app/lib/types/alerts';

export const TOAST_DURATION_MS = 10_000;

export interface ToastEntry {
  key: string;
  alert: Alert;
}

interface ToastContextValue {
  toasts: ToastEntry[];
  push: (alert: Alert) => void;
  dismiss: (key: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const liveAlertIdsRef = useRef<Set<string>>(new Set());

  const dismiss = useCallback((key: string) => {
    setToasts((prev) => {
      const match = prev.find((t) => t.key === key);
      if (match) liveAlertIdsRef.current.delete(match.alert.id);
      return prev.filter((t) => t.key !== key);
    });
    const timer = timersRef.current.get(key);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(key);
    }
  }, []);

  const push = useCallback(
    (alert: Alert) => {
      if (liveAlertIdsRef.current.has(alert.id)) return;
      liveAlertIdsRef.current.add(alert.id);
      const key = `${alert.id}-${Date.now()}`;
      setToasts((prev) => [{ key, alert }, ...prev]);
      const timer = setTimeout(() => dismiss(key), TOAST_DURATION_MS);
      timersRef.current.set(key, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>{children}</ToastContext.Provider>
  );
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToasts must be used inside ToastProvider');
  return { toasts: ctx.toasts, dismiss: ctx.dismiss };
}

export function useToastPublisher() {
  const ctx = useContext(ToastContext);
  const push = ctx?.push;
  return useCallback(
    (alert: Alert) => {
      if (!push) return;
      push(alert);
    },
    [push],
  );
}
