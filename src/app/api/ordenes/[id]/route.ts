import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const orden = await prisma.ordenCompra.update({
    where: { id: params.id },
    data: {
      concepto: body.concepto,
      descripcion: body.descripcion || null,
      monto: parseFloat(body.monto) || 0,
      moneda: body.moneda || 'USD',
      estado: body.estado,
      proveedorId: body.proveedorId,
      fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
      fechaPago: body.fechaPago ? new Date(body.fechaPago) : null,
      categoria: body.categoria || null,
      aprobadoPor: body.aprobadoPor || null,
      notas: body.notas || null,
    },
    include: { proveedor: true },
  });
  return NextResponse.json(orden);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.ordenCompra.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
