import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const notifs = await prisma.notification.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(notifs);
}

export async function POST(request: NextRequest) {
  const { userId, type, title, message, link } = await request.json();
  const notif = await prisma.notification.create({
    data: { userId, type: type || 'info', title, message, link: link || null },
  });
  return NextResponse.json(notif);
}

export async function PATCH(request: NextRequest) {
  const { id, read } = await request.json();
  if (id) {
    await prisma.notification.update({ where: { id }, data: { read } });
  } else {
    const { userId } = await request.json();
    if (userId) {
      await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    }
  }
  return NextResponse.json({ ok: true });
}
