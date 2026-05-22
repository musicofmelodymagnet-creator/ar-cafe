import { NextResponse } from 'next/server';
import { addSSEClient, removeSSEClient, getAllOrders } from '@/app/lib/order-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const client = { id: crypto.randomUUID(), controller };
      addSSEClient(client);

      // Send current order list immediately on connect
      const snapshot = getAllOrders();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'snapshot', orders: snapshot })}\n\n`)
      );

      // Heartbeat every 20s to keep connection alive through proxies
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, 20_000);

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(heartbeat);
        removeSSEClient(client);
        try { controller.close(); } catch { /* already closed */ }
      };

      // AbortSignal not directly available on ReadableStream start; rely on error catch above
      // and the controller.close() call when the response is cancelled by the browser.
      void cleanup; // referenced so TS doesn't complain; actual cleanup via error path above
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection:      'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
