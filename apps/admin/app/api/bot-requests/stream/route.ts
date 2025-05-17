import { getRedisCache } from '@databuddy/redis';

export const runtime = 'nodejs';

export async function GET() {
  const redis = getRedisCache();

  let subscriber: any;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };

      subscriber = redis.duplicate();
      await subscriber.subscribe('bot_requests', (message: string) => {
        try {
          const data = JSON.parse(message);
          send(data);
        } catch (e) {
          // ignore
        }
      });
    },

    async cancel() {
      if (subscriber) {
        await subscriber.unsubscribe('bot_requests');
        await subscriber.quit();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
} 