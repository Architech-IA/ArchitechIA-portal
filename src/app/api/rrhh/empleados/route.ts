import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const empleados = await prisma.empleadoRRHH.findMany({
    include: { nominas: true, vacaciones: true },
    orderBy: { nombre: 'asc' },
  });
  return NextResponse.json(empleados);
}

export async function POST(req: Request) {
  const body = await req.json();
  const empleado = await prisma.empleadoRRHH.create({
    data: {
      nombre: body.nombre,
      email: body.email,
      cargo: body.cargo,
      departamento: body.departamento,
      tipo: body.tipo || 'FULL_TIME',
      estado: body.estado || 'ACTIVO',
      salarioBase: parseFloat(body.salarioBase) || 0,
      moneda: body.moneda || 'USD',
      fechaIngreso: new Date(body.fechaIngreso),
      pais: body.pais || null,
      userId: body.userId || null,
      notas: body.notas || null,
    },
  });
  return NextResponse.json(empleado, { status: 201 });
}
