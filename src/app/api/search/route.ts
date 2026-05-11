import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2) return NextResponse.json({ leads: [], proposals: [], projects: [], clientes: [], backlog: [], meetings: [] });

  const [leads, proposals, projects, clientes, backlog, meetings] = await Promise.all([
    prisma.lead.findMany({
      where: {
        OR: [
          { companyName: { contains: q, mode: 'insensitive' } },
          { contactName: { contains: q, mode: 'insensitive' } },
          { email:       { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, companyName: true, contactName: true, status: true, estimatedValue: true },
      take: 5,
    }),
    prisma.proposal.findMany({
      where: {
        OR: [
          { title:       { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, title: true, status: true, amount: true },
      take: 5,
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name:        { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, status: true, progress: true },
      take: 5,
    }),
    prisma.cliente.findMany({
      where: { OR: [
        { nombre:   { contains: q, mode: 'insensitive' } },
        { contacto: { contains: q, mode: 'insensitive' } },
        { email:    { contains: q, mode: 'insensitive' } },
      ]},
      select: { id: true, nombre: true, industria: true, estado: true },
      take: 5,
    }),
    prisma.backlogItem.findMany({
      where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, title: true, status: true, type: true },
      take: 5,
    }),
    prisma.meeting.findMany({
      where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { notes: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, title: true, date: true, type: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ leads, proposals, projects, clientes, backlog, meetings });
}
