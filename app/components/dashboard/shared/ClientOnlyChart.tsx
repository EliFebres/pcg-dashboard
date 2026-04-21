'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

interface ClientOnlyChartProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const noopSubscribe = () => () => {};

// Defers chart rendering until after first paint so Recharts ResizeObserver
// always sees real container dimensions instead of -1x-1. Using
// useSyncExternalStore with distinct server/client snapshots avoids the
// setState-in-effect anti-pattern.
export default function ClientOnlyChart({ children, fallback = null }: ClientOnlyChartProps) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return mounted ? <>{children}</> : <>{fallback}</>;
}
