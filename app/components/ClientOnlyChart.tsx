'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

interface ClientOnlyChartProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Simple store that returns true after hydration
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

// Wrapper component that only renders children on the client
// This prevents Recharts SSR warnings about container dimensions
export default function ClientOnlyChart({ children, fallback = null }: ClientOnlyChartProps) {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  if (!isClient) {
    return fallback;
  }

  return <>{children}</>;
}
