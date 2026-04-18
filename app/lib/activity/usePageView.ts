'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function usePageView() {
  const pathname = usePathname();
  const lastLoggedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
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
