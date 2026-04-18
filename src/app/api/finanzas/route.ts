import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const registros = await prisma.registroFinanciero.findMany({
    orderBy: { fecha: 'desc' },
  });
  return NextResponse.json(registros);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { fecha, tipo, categoria, concepto, monto, moneda, proyecto, estado, responsable } = body;

  const registro = await prisma.registroFinanciero.create({
    data: { fecha, tipo, categoria, concepto, monto: parseFloat(monto) || 0, moneda, proyecto, estado, responsable },
  });
  return NextResponse.json(registro);
}
