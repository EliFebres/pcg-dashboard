'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Paths whose views should never be logged (meta-pages like the activity
// dashboard itself — tracking them would pollute the feed with noise).
const EXCLUDED_PATHS = ['/dashboard/activity'];

export function usePageView() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (EXCLUDED_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) return;
    if (lastLoggedPath.current === pathname) return;
    lastLoggedPath.current = pathname;

    fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'page.view', path: pathname }),
      keepalive: true,
    }).catch(() => {
      // Silent: page view logging must not disrupt the user.
    });
  }, [pathname]);
}
