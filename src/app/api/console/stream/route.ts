import { getRuntimeLogs, getConsoleStats, subscribeToRuntimeLogs, RuntimeLogEntry } from '@/lib/runtime-logs';

export const runtime = 'nodejs';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to enqueue SSE message
      const sendEvent = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Stream might be closed
        }
      };

      // 1. Send initial state
      try {
        const [logs, stats] = await Promise.all([
          getRuntimeLogs(60),
          getConsoleStats(),
        ]);
        sendEvent('init', { logs, stats });
      } catch (err) {
        console.error('Failed to get initial logs for stream:', err);
      }

      // 2. Subscribe to real-time events
      const unsubscribe = subscribeToRuntimeLogs((entry: RuntimeLogEntry) => {
        sendEvent('log', entry);
      });

      // 3. Heartbeat interval to keep connection active
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 10000);

      // Clean up on abort
      const checkInterval = setInterval(() => {
        if (controller.desiredSize === null) {
          clearInterval(heartbeatInterval);
          clearInterval(checkInterval);
          unsubscribe();
        }
      }, 3000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
