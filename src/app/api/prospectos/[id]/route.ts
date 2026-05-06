import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.empresa !== undefined) data.empresa = body.empresa;
  if (body.industria !== undefined) data.industria = body.industria;
  if (body.nicho !== undefined) data.nicho = body.nicho || null;
  if (body.contacto !== undefined) data.contacto = body.contacto || null;
  if (body.email !== undefined) data.email = body.email || null;
  if (body.telefono !== undefined) data.telefono = body.telefono || null;
  if (body.pais !== undefined) data.pais = body.pais || null;
  if (body.fuente !== undefined) data.fuente = body.fuente;
  if (body.estado !== undefined) data.estado = body.estado;
  if (body.prioridad !== undefined) data.prioridad = body.prioridad;
  if (body.notas !== undefined) data.notas = body.notas || null;
  if (body.userId !== undefined) data.userId = body.userId;

  const prospecto = await prisma.prospecto.update({
    where: { id },
    data,
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json(prospecto);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.prospecto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
