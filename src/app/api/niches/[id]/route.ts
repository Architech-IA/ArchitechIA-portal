import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.color !== undefined) data.color = body.color;
  if (body.size !== undefined) data.size = body.size;
  if (body.x !== undefined) data.x = body.x;
  if (body.y !== undefined) data.y = body.y;
  if (body.description !== undefined) data.description = body.description || null;
  if (body.industry !== undefined) data.industry = body.industry;
  if (body.potential !== undefined) data.potential = body.potential;
  if (body.competitors !== undefined) data.competitors = body.competitors;
  if (body.trend !== undefined) data.trend = body.trend;
  if (body.userId !== undefined) data.userId = body.userId;

  const niche = await prisma.nicheMarket.update({
    where: { id },
    data,
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(niche);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.nicheConnection.deleteMany({ where: { OR: [{ fromId: id }, { toId: id }] } });
  await prisma.nicheMarket.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
