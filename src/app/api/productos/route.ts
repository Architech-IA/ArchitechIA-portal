import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const productos = await prisma.producto.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(productos.map(p => ({
    ...p,
    tecnologias: JSON.parse(p.tecnologias),
    caracteristicas: JSON.parse(p.caracteristicas),
  })));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, version, estado, descripcion, tecnologias, caracteristicas, icono, color } = body;
  const producto = await prisma.producto.create({
    data: {
      nombre, version, estado, descripcion, icono, color,
      tecnologias: JSON.stringify(tecnologias),
      caracteristicas: JSON.stringify(caracteristicas),
    },
  });
  return NextResponse.json({ ...producto, tecnologias, caracteristicas });
}
