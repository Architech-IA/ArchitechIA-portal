import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo');

  const soluciones = await prisma.solucion.findMany({
    where: tipo ? { tipo } : undefined,
    include: { lead: { select: { id: true, companyName: true, contactName: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(soluciones);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, descripcion, tipo, estado, valorEstimado, leadId } = body;

  const solucion = await prisma.solucion.create({
    data: {
      nombre,
      descripcion: descripcion || null,
      tipo,
      estado: estado || 'ACTIVO',
      valorEstimado: parseFloat(valorEstimado) || 0,
      leadId: leadId || null,
    },
    include: { lead: { select: { id: true, companyName: true, contactName: true, status: true } } },
  });

  return NextResponse.json(solucion);
}
