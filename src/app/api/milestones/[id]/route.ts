import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  const milestone = await prisma.milestone.update({
    where: { id },
    data: {
      status,
      completedDate: status === 'COMPLETED' ? new Date() : null,
    },
  });
  return NextResponse.json(milestone);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  await prisma.milestone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
