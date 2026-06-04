import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

// Aprobar (elimina la iniciativa) o rechazar una solicitud. Solo SUPERADMIN.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || (token as { role?: string }).role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const { action } = await request.json() // 'APROBAR' | 'RECHAZAR'

  const req = await prisma.iniciativaDeleteRequest.findUnique({ where: { id } })
  if (!req) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  if (req.status !== 'PENDIENTE') {
    return NextResponse.json({ error: 'La solicitud ya fue resuelta' }, { status: 400 })
  }

  const resolvedByName = (token.name as string) || (token.email as string) || null

  if (action === 'APROBAR') {
    // Marca como aprobada y elimina la iniciativa (cascade borra la solicitud,
    // así que primero guardamos el estado por si se quisiera auditar aparte).
    await prisma.iniciativaDeleteRequest.update({
      where: { id },
      data: { status: 'APROBADA', resolvedById: token.id as string, resolvedByName, resolvedAt: new Date() },
    })
    try {
      await prisma.iniciativa.delete({ where: { id: req.iniciativaId } })
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: 'Error al eliminar la iniciativa' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, deleted: req.iniciativaId })
  }

  if (action === 'RECHAZAR') {
    const updated = await prisma.iniciativaDeleteRequest.update({
      where: { id },
      data: { status: 'RECHAZADA', resolvedById: token.id as string, resolvedByName, resolvedAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
}
