'use client';

import { useState, useEffect, type ReactNode } from 'react';

interface ClientOnlyChartProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Defers chart rendering until after first paint so Recharts ResizeObserver
// always sees real container dimensions instead of -1x-1.
export default function ClientOnlyChart({ children, fallback = null }: ClientOnlyChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? <>{children}</> : <>{fallback}</>;
}
