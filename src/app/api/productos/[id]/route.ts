import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { nombre, version, estado, descripcion, tecnologias, caracteristicas, icono, color } = body;
  try {
    const producto = await prisma.producto.update({
      where: { id },
      data: {
        nombre, version, estado, descripcion, icono, color,
        tecnologias: JSON.stringify(tecnologias),
        caracteristicas: JSON.stringify(caracteristicas),
      },
    });
    return NextResponse.json({ ...producto, tecnologias, caracteristicas });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.producto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
