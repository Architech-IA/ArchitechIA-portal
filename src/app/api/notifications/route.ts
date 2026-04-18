import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const hoy     = new Date();
  const hace7d  = new Date(hoy); hace7d.setDate(hoy.getDate() - 7);
  const hace5d  = new Date(hoy); hace5d.setDate(hoy.getDate() - 5);
  const en7d    = new Date(hoy); en7d.setDate(hoy.getDate() + 7);

  const [leadsInactivos, propuestasSinRespuesta, proximosDeadlines, registrosPendientes] =
    await Promise.all([
      prisma.lead.findMany({
        where: { status: { notIn: ['WON', 'LOST'] }, updatedAt: { lt: hace7d } },
        select: { id: true, companyName: true, updatedAt: true },
        take: 5,
      }),
      prisma.proposal.findMany({
        where: { status: 'SENT', sentDate: { lt: hace5d } },
        select: { id: true, title: true, sentDate: true },
        take: 5,
      }),
      prisma.project.findMany({
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] }, endDate: { lte: en7d, gte: hoy } },
        select: { id: true, name: true, endDate: true, priority: true },
        orderBy: { endDate: 'asc' },
        take: 5,
      }),
      prisma.registroFinanciero.findMany({
        where: { estado: 'pendiente' },
        select: { id: true, concepto: true, monto: true, moneda: true },
        take: 5,
      }),
    ]);

  const notifs = [
    ...leadsInactivos.map(l => ({
      id:    `lead-${l.id}`,
      tipo:  'lead' as const,
      texto: `Lead sin actividad: ${l.companyName}`,
      sub:   `Sin actualizar desde hace ${Math.floor((hoy.getTime() - new Date(l.updatedAt).getTime()) / 86400000)} días`,
      href:  '/leads',
      leida: false,
    })),
    ...propuestasSinRespuesta.map(p => ({
      id:    `prop-${p.id}`,
      tipo:  'propuesta' as const,
      texto: `Propuesta sin respuesta: ${p.title}`,
      sub:   `Enviada hace ${Math.floor((hoy.getTime() - new Date(p.sentDate!).getTime()) / 86400000)} días`,
      href:  '/proposals',
      leida: false,
    })),
    ...proximosDeadlines.map(p => ({
      id:    `proj-${p.id}`,
      tipo:  'proyecto' as const,
      texto: `Deadline próximo: ${p.name}`,
      sub:   `Vence el ${new Date(p.endDate!).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
      href:  '/projects',
      leida: false,
    })),
    ...registrosPendientes.map(r => ({
      id:    `fin-${r.id}`,
      tipo:  'finanza' as const,
      texto: `Pago pendiente: ${r.concepto}`,
      sub:   `${r.moneda === 'EUR' ? '€' : '$'}${r.monto.toLocaleString()} ${r.moneda}`,
      href:  '/finanzas',
      leida: false,
    })),
  ];

  return NextResponse.json({ notifs, total: notifs.length });
}
