import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');

  if (!entityType || !entityId) {
    return NextResponse.json([]);
  }

  const comments = await prisma.comment.findMany({
    where: { entityType, entityId, parentId: null },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      replies: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  const { text, entityType, entityId, parentId, userId } = await request.json();

  const comment = await prisma.comment.create({
    data: { text, entityType, entityId, parentId: parentId || null, userId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  return NextResponse.json(comment);
}
