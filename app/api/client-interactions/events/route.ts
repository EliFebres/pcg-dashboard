export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { requireAuth } from '@/app/lib/auth/require-auth';
import { engagementEmitter } from '@/app/lib/events';

// GET /api/client-interactions/events
// Server-Sent Events stream — clients connect once and receive 'change' events
// whenever any engagement is created, updated, or deleted.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string) => {
        controller.enqueue(`data: ${type}\n\n`);
      };

      // Send an initial heartbeat so the client knows the connection is live
      send('connected');

      const onChange = (type: string) => send(type);
      engagementEmitter.on('change', onChange);

      // Keep-alive ping every 30 seconds to prevent proxy/browser timeouts
      const keepAlive = setInterval(() => {
        controller.enqueue(': ping\n\n');
      }, 30_000);

      req.signal.addEventListener('abort', () => {
        engagementEmitter.off('change', onChange);
        clearInterval(keepAlive);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
