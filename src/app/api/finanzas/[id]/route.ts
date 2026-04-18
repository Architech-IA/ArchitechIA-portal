import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { fecha, tipo, categoria, concepto, monto, moneda, proyecto, estado, responsable } = body;

  try {
    const registro = await prisma.registroFinanciero.update({
      where: { id },
      data: { fecha, tipo, categoria, concepto, monto: parseFloat(monto) || 0, moneda, proyecto, estado, responsable },
    });
    return NextResponse.json(registro);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar el registro' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.registroFinanciero.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar el registro' }, { status: 500 });
  }
}
