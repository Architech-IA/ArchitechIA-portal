import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const [leads, proposals, projects, activities] = await Promise.all([
    prisma.lead.count(),
    prisma.proposal.count(),
    prisma.project.count(),
    prisma.activity.count(),
  ]);

  const [leadsByStatus, proposalsByStatus, projectsByStatus] = await Promise.all([
    prisma.lead.groupBy({ by: ['status'], _count: true }),
    prisma.proposal.groupBy({ by: ['status'], _count: true }),
    prisma.project.groupBy({ by: ['status'], _count: true }),
  ]);

  const totalValue = await prisma.lead.aggregate({
    _sum: { estimatedValue: true },
  });

  // Tasa de conversión
  const leadsGanados = await prisma.lead.count({ where: { status: 'WON' } });
  const conversionRate = leads > 0 ? Math.round((leadsGanados / leads) * 100) : 0;

  // Leads sin actividad en más de 7 días
  const hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);
  const leadsInactivos = await prisma.lead.findMany({
    where: {
      status: { notIn: ['WON', 'LOST'] },
      updatedAt: { lt: hace7dias },
    },
    select: { id: true, companyName: true, status: true, updatedAt: true },
    take: 5,
  });

  // Propuestas sin respuesta en más de 5 días
  const hace5dias = new Date();
  hace5dias.setDate(hace5dias.getDate() - 5);
  const propuestasSinRespuesta = await prisma.proposal.findMany({
    where: {
      status: 'SENT',
      sentDate: { lt: hace5dias },
    },
    select: { id: true, title: true, amount: true, sentDate: true },
    take: 5,
  });

  // Proyectos con fecha límite próxima (7 días)
  const en7dias = new Date();
  en7dias.setDate(en7dias.getDate() + 7);
  const proximosDeadlines = await prisma.project.findMany({
    where: {
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
      endDate: { lte: en7dias, gte: new Date() },
    },
    select: { id: true, name: true, endDate: true, progress: true, priority: true },
    orderBy: { endDate: 'asc' },
    take: 5,
  });

  // Top socios por leads
  const topSocios = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      _count: { select: { leads: true, proposals: true, projects: true } },
    },
    orderBy: { leads: { _count: 'desc' } },
    take: 4,
  });

  // Embudo de ventas (orden de etapas)
  const etapasOrden = ['NEW', 'CONTACTED', 'DIAGNOSIS', 'QUALIFIED', 'DEMO_VALIDATION', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON'];
  const embudo = await Promise.all(
    etapasOrden.map(async (status) => ({
      status,
      count: await prisma.lead.count({ where: { status: status as never } }),
      valor: (await prisma.lead.aggregate({
        where: { status: status as never },
        _sum: { estimatedValue: true },
      }))._sum.estimatedValue || 0,
    }))
  );

  // Distribución por industria (simulada desde companyName — en producción vendría de un campo industry)
  const industriaLeads = await prisma.lead.groupBy({
    by: ['source'],
    _count: true,
  });

  // Meta mensual (simulada: $30,000)
  const metaMensual = 30000;
  const ingresosMes = 27000; // En producción vendría de la tabla de finanzas

  const recentActivities = await prisma.activity.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    counts: { leads, proposals, projects, activities },
    leadsByStatus,
    proposalsByStatus,
    projectsByStatus,
    totalEstimatedValue: totalValue._sum.estimatedValue || 0,
    conversionRate,
    leadsGanados,
    leadsInactivos,
    propuestasSinRespuesta,
    proximosDeadlines,
    topSocios,
    embudo,
    industriaLeads,
    metaMensual,
    ingresosMes,
    recentActivities,
  });
}
