import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const vacaciones = await prisma.solicitudVacacion.findMany({
    include: { empleado: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(vacaciones);
}

export async function POST(req: Request) {
  const body = await req.json();
  const desde = new Date(body.desde);
  const hasta = new Date(body.hasta);
  const diff = Math.ceil((hasta.getTime() - desde.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const solicitud = await prisma.solicitudVacacion.create({
    data: {
      empleadoId: body.empleadoId,
      desde,
      hasta,
      dias: body.dias || diff,
      tipo: body.tipo || 'VACACION',
      estado: body.estado || 'PENDIENTE',
      aprobadoPor: body.aprobadoPor || null,
      notas: body.notas || null,
    },
    include: { empleado: true },
  });
  return NextResponse.json(solicitud, { status: 201 });
}
