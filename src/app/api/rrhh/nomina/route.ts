import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const nominas = await prisma.registroNomina.findMany({
    include: { empleado: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(nominas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const salarioBase = parseFloat(body.salarioBase) || 0;
  const bonos = parseFloat(body.bonos) || 0;
  const deducciones = parseFloat(body.deducciones) || 0;
  const total = salarioBase + bonos - deducciones;
  const nomina = await prisma.registroNomina.create({
    data: {
      empleadoId: body.empleadoId,
      periodo: body.periodo,
      salarioBase,
      bonos,
      deducciones,
      total,
      moneda: body.moneda || 'USD',
      estado: body.estado || 'PENDIENTE',
      fechaPago: body.fechaPago ? new Date(body.fechaPago) : null,
      notas: body.notas || null,
    },
    include: { empleado: true },
  });
  return NextResponse.json(nomina, { status: 201 });
}
