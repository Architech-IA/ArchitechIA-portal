import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// Lista solicitudes. Solo el SUPERADMIN ve la bandeja completa.
export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const role = (token as { role?: string })?.role
  if (role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const requests = await prisma.iniciativaDeleteRequest.findMany({
    where: { status: 'PENDIENTE' },
    include: { iniciativa: { select: { id: true, nombre: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(requests)
}

// Cualquier usuario autenticado puede solicitar la eliminación de una iniciativa.
export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { iniciativaId, reason } = await request.json()
  if (!iniciativaId) {
    return NextResponse.json({ error: 'Falta la iniciativa' }, { status: 400 })
  }

  // Evita solicitudes duplicadas pendientes para la misma iniciativa.
  const existing = await prisma.iniciativaDeleteRequest.findFirst({
    where: { iniciativaId, status: 'PENDIENTE' },
  })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una solicitud pendiente para esta iniciativa', request: existing }, { status: 409 })
  }

  const req = await prisma.iniciativaDeleteRequest.create({
    data: {
      iniciativaId,
      reason: reason || null,
      requestedById: (token.id as string) || '',
      requesterName: (token.name as string) || (token.email as string) || null,
    },
  })
  return NextResponse.json(req)
}
