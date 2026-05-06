import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fromId, toId, label, strength } = body;

  const existing = await prisma.nicheConnection.findFirst({
    where: { OR: [
      { fromId, toId },
      { fromId: toId, toId: fromId },
    ]},
  });

  if (existing) {
    return NextResponse.json({ error: 'Ya existe una conexión entre estos nichos' }, { status: 409 });
  }

  const connection = await prisma.nicheConnection.create({
    data: { fromId, toId, label: label || null, strength: strength || 1 },
  });

  return NextResponse.json(connection);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  await prisma.nicheConnection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
