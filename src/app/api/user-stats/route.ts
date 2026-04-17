import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          leads: true,
          proposals: true,
          projects: true,
          activities: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  // Obtener leads recientes
  const leads = await prisma.lead.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      companyName: true,
      contactName: true,
      status: true,
      estimatedValue: true,
      createdAt: true,
    },
  });

  // Obtener propuestas recientes
  const proposals = await prisma.proposal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      status: true,
      amount: true,
      createdAt: true,
    },
  });

  // Obtener proyectos recientes donde el usuario es miembro
  const projects = await prisma.project.findMany({
    where: { users: { some: { userId } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      status: true,
      priority: true,
      progress: true,
      createdAt: true,
    },
  });

  // Calcular métricas
  const totalLeadValue = await prisma.lead.aggregate({
    where: { userId },
    _sum: { estimatedValue: true },
  });

  const totalProposalAmount = await prisma.proposal.aggregate({
    where: { userId },
    _sum: { amount: true },
  });

  const acceptedProposals = await prisma.proposal.count({
    where: { userId, status: 'ACCEPTED' },
  });

  return NextResponse.json({
    user,
    stats: {
      totalLeadValue: totalLeadValue._sum.estimatedValue || 0,
      totalProposalAmount: totalProposalAmount._sum.amount || 0,
      acceptedProposals,
    },
    leads,
    proposals,
    projects,
  });
}
