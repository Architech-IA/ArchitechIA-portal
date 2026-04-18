import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const clientes = await prisma.cliente.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombre, industria, contacto, email, pais, estado, valorTotal } = body;
  const cliente = await prisma.cliente.create({
    data: { nombre, industria, contacto, email, pais, estado, valorTotal: parseFloat(valorTotal) || 0 },
  });
  return NextResponse.json(cliente);
}
