export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { requireAuth } from '@/app/lib/auth/require-auth';
import { userEmitter } from '@/app/lib/events';

// GET /api/admin/users/events
// Server-Sent Events stream — admin clients connect once and receive 'change' events
// whenever a new user registers.
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;
  if (auth.payload.role !== 'admin') {
    return new Response('Forbidden', { status: 403 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string) => {
        controller.enqueue(`data: ${type}\n\n`);
      };

      // Send an initial heartbeat so the client knows the connection is live
      send('connected');

      const onChange = (type: string) => send(type);
      userEmitter.on('change', onChange);

      // Keep-alive ping every 30 seconds to prevent proxy/browser timeouts
      const keepAlive = setInterval(() => {
        controller.enqueue(': ping\n\n');
      }, 30_000);

      req.signal.addEventListener('abort', () => {
        userEmitter.off('change', onChange);
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
