import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const proveedores = await prisma.proveedor.findMany({
    include: { ordenes: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(proveedores);
}

export async function POST(req: Request) {
  const body = await req.json();
  const proveedor = await prisma.proveedor.create({
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      contacto: body.contacto || null,
      email: body.email || null,
      telefono: body.telefono || null,
      pais: body.pais || null,
      website: body.website || null,
      estado: body.estado || 'ACTIVO',
      notas: body.notas || null,
    },
  });
  return NextResponse.json(proveedor, { status: 201 });
}
