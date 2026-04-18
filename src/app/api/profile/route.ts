import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const userId = token.sub;

  const [user, leadsCount, proposalsCount, projectsCount, recentActivity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.lead.count({ where: { userId } }),
    prisma.proposal.count({ where: { userId } }),
    prisma.project.count({ where: { users: { some: { userId } } } }),
    prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const pipelineValue = await prisma.lead.aggregate({
    where: { userId, status: { notIn: ['LOST'] } },
    _sum: { estimatedValue: true },
  });

  const leadsGanados = await prisma.lead.count({ where: { userId, status: 'WON' } });

  return NextResponse.json({
    user,
    stats: {
      leads:         leadsCount,
      proposals:     proposalsCount,
      projects:      projectsCount,
      pipelineValue: pipelineValue._sum.estimatedValue || 0,
      leadsGanados,
    },
    recentActivity,
  });
}
