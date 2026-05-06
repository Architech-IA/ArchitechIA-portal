export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(async () => {
        try {
          const { prisma } = await import('@/lib/prisma');
          const notifications = await prisma.notification.findMany({
            where: { read: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(notifications)}\n\n`));
        } catch {}
      }, 10000);

      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(': keepalive\n\n'));
      }, 30000);

      return () => {
        clearInterval(interval);
        clearInterval(keepAlive);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
