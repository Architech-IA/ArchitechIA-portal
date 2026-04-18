import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const notes = await prisma.activity.findMany({
    where: { leadId: id, type: 'NOTE_ADDED' },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(notes);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const { text } = await request.json();
  if (!text?.trim()) return NextResponse.json({ error: 'Nota vacía' }, { status: 400 });

  const note = await prisma.activity.create({
    data: {
      type: 'NOTE_ADDED',
      description: text.trim(),
      entityType: 'lead',
      entityId: id,
      userId: token.sub,
      leadId: id,
    },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(note);
}
