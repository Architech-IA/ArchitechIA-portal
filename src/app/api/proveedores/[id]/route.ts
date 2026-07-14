import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const proveedor = await prisma.proveedor.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      contacto: body.contacto || null,
      email: body.email || null,
      telefono: body.telefono || null,
      pais: body.pais || null,
      website: body.website || null,
      estado: body.estado,
      notas: body.notas || null,
    },
  });
  return NextResponse.json(proveedor);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.proveedor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
