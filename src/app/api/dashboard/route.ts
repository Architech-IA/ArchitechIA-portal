import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [leads, proposals, projects, activities] = await Promise.all([
    prisma.lead.count(),
    prisma.proposal.count(),
    prisma.project.count(),
    prisma.activity.count(),
  ]);

  const leadsByStatus = await prisma.lead.groupBy({
    by: ['status'],
    _count: true,
  });

  const proposalsByStatus = await prisma.proposal.groupBy({
    by: ['status'],
    _count: true,
  });

  const projectsByStatus = await prisma.project.groupBy({
    by: ['status'],
    _count: true,
  });

  const totalValue = await prisma.lead.aggregate({
    _sum: { estimatedValue: true },
  });

  const recentActivities = await prisma.activity.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    counts: { leads, proposals, projects, activities },
    leadsByStatus,
    proposalsByStatus,
    projectsByStatus,
    totalEstimatedValue: totalValue._sum.estimatedValue || 0,
    recentActivities,
  });
}
