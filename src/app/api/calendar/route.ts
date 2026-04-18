import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [projects, proposals] = await Promise.all([
    prisma.project.findMany({
      where: { endDate: { not: null }, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      select: { id: true, name: true, endDate: true, priority: true, status: true },
    }),
    prisma.proposal.findMany({
      where: { sentDate: { not: null } },
      select: { id: true, title: true, sentDate: true, status: true, amount: true },
    }),
  ]);

  const events = [
    ...projects.map(p => ({
      id:    p.id,
      title: p.name,
      date:  p.endDate!.toISOString().split('T')[0],
      type:  'project' as const,
      meta:  p.status,
      extra: p.priority,
    })),
    ...proposals.map(p => ({
      id:    p.id,
      title: p.title,
      date:  p.sentDate!.toISOString().split('T')[0],
      type:  'proposal' as const,
      meta:  p.status,
      extra: String(p.amount),
    })),
  ];

  return NextResponse.json(events);
}
