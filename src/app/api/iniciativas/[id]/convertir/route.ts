import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const PRIORIDAD_MAP: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = {
  BAJA: 'LOW',
  MEDIA: 'MEDIUM',
  ALTA: 'HIGH',
  CRITICA: 'CRITICAL',
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const iniciativa = await prisma.iniciativa.findUnique({ where: { id } })
  if (!iniciativa) return NextResponse.json({ error: 'Iniciativa no encontrada' }, { status: 404 })
  if (iniciativa.proyectoId) {
    return NextResponse.json({ error: 'Esta iniciativa ya tiene un proyecto asociado' }, { status: 400 })
  }

  const userId = token.id as string

  const project = await prisma.project.create({
    data: {
      name: iniciativa.nombre,
      description: iniciativa.descripcion,
      status: 'PLANNING',
      priority: PRIORIDAD_MAP[iniciativa.prioridad] ?? 'MEDIUM',
      users: { create: { userId, role: 'OWNER' } },
    },
  })

  const updated = await prisma.iniciativa.update({
    where: { id },
    data: {
      proyectoId: project.id,
      // Si aún estaba en fases tempranas, pasa a ejecución.
      estado: ['IDEA', 'EVALUACION', 'APROBADA'].includes(iniciativa.estado)
        ? 'EN_EJECUCION'
        : iniciativa.estado,
    },
  })

  return NextResponse.json({ projectId: project.id, iniciativa: updated })
}
