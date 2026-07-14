import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const solicitud = await prisma.solicitudVacacion.update({
    where: { id: params.id },
    data: {
      estado: body.estado,
      aprobadoPor: body.aprobadoPor || null,
      notas: body.notas || null,
    },
    include: { empleado: true },
  });
  return NextResponse.json(solicitud);
}
