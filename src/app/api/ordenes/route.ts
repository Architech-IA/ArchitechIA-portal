import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const ordenes = await prisma.ordenCompra.findMany({
    include: { proveedor: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(ordenes);
}

export async function POST(req: Request) {
  const body = await req.json();
  // Auto-generate order number
  const count = await prisma.ordenCompra.count();
  const numero = `OC-${String(count + 1).padStart(4, '0')}`;
  const orden = await prisma.ordenCompra.create({
    data: {
      numero,
      concepto: body.concepto,
      descripcion: body.descripcion || null,
      monto: parseFloat(body.monto) || 0,
      moneda: body.moneda || 'USD',
      estado: body.estado || 'PENDIENTE',
      proveedorId: body.proveedorId,
      fechaEmision: body.fechaEmision ? new Date(body.fechaEmision) : new Date(),
      fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
      fechaPago: body.fechaPago ? new Date(body.fechaPago) : null,
      categoria: body.categoria || null,
      aprobadoPor: body.aprobadoPor || null,
      notas: body.notas || null,
    },
    include: { proveedor: true },
  });
  return NextResponse.json(orden, { status: 201 });
}
