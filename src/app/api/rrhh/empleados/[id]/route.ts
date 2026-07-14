import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const empleado = await prisma.empleadoRRHH.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre,
      email: body.email,
      cargo: body.cargo,
      departamento: body.departamento,
      tipo: body.tipo,
      estado: body.estado,
      salarioBase: parseFloat(body.salarioBase) || 0,
      moneda: body.moneda || 'USD',
      fechaIngreso: new Date(body.fechaIngreso),
      fechaBaja: body.fechaBaja ? new Date(body.fechaBaja) : null,
      pais: body.pais || null,
      notas: body.notas || null,
    },
  });
  return NextResponse.json(empleado);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.empleadoRRHH.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
