import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const activities = await prisma.activity.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return NextResponse.json(activities);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { type, description, entityType, entityId, userId } = body;
  
  const activity = await prisma.activity.create({
    data: {
      type,
      description,
      entityType,
      entityId,
      userId,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(activity);
}
