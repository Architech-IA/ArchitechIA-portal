import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [niches, connections] = await Promise.all([
    prisma.nicheMarket.findMany({ include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.nicheConnection.findMany(),
  ]);
  return NextResponse.json({ niches, connections });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, color, size, x, y, description, industry, potential, competitors, trend, userId } = body;

  const niche = await prisma.nicheMarket.create({
    data: {
      name, color: color || '#f97316', size: size || 30,
      x: x || 0, y: y || 0, description: description || null,
      industry, potential: potential || 0,
      competitors: competitors || 0, trend: trend || 'stable', userId,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(niche);
}
