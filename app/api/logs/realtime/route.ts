import { NextRequest } from 'next/server';
import { logger, LogEntry } from '@/lib/logger';

// Ensure this route is always dynamic and not cached
export const dynamic = 'force-dynamic';

// Server-Sent Events endpoint for real-time logs
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  // Create a custom readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log('[Realtime Logs] Client connected');

      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Connected to realtime logs',
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(connectMessage));

      // Send recent logs on connection
      logger.getLogs().then(logs => {
        // Send last 10 logs to get started
        const recentLogs = logs.slice(0, 10).reverse();
        recentLogs.forEach(log => {
          const message = `data: ${JSON.stringify({
            type: 'log',
            log,
          })}\n\n`;
          controller.enqueue(encoder.encode(message));
        });
      });

      // Subscribe to new logs
      const unsubscribe = logger.subscribe((log: LogEntry) => {
        try {
          const message = `data: ${JSON.stringify({
            type: 'log',
            log,
          })}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('[Realtime Logs] Error sending log:', error);
        }
      });

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('[Realtime Logs] Error sending heartbeat:', error);
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        console.log('[Realtime Logs] Client disconnected');
        clearInterval(heartbeatInterval);
        unsubscribe();
        controller.close();
      });
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
