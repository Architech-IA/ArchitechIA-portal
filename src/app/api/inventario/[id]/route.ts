import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const activo = await prisma.activo.update({
    where: { id: params.id },
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      categoria: body.categoria || null,
      estado: body.estado,
      valor: parseFloat(body.valor) || 0,
      moneda: body.moneda || 'USD',
      fechaAdquisicion: body.fechaAdquisicion ? new Date(body.fechaAdquisicion) : null,
      fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
      proveedorNombre: body.proveedorNombre || null,
      responsable: body.responsable || null,
      ubicacion: body.ubicacion || null,
      serial: body.serial || null,
      notas: body.notas || null,
    },
  });
  return NextResponse.json(activo);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.activo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
