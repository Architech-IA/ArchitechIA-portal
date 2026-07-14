import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const activos = await prisma.activo.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(activos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const activo = await prisma.activo.create({
    data: {
      nombre: body.nombre,
      tipo: body.tipo,
      categoria: body.categoria || null,
      estado: body.estado || 'ACTIVO',
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
  return NextResponse.json(activo, { status: 201 });
}
