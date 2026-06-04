import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

function parseTec(value: string): string[] {
  try {
    const arr = JSON.parse(value)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const {
    nombre, descripcion, categoria, estado, prioridad, sector, problema,
    beneficios, tecnologias, costoEstimado, roiEstimado, color,
  } = body

  try {
    const iniciativa = await prisma.iniciativa.update({
      where: { id },
      data: {
        nombre, descripcion, categoria, estado, prioridad,
        sector: sector || null,
        problema: problema || null,
        beneficios: beneficios || null,
        ...(tecnologias !== undefined
          ? { tecnologias: JSON.stringify(Array.isArray(tecnologias) ? tecnologias : []) }
          : {}),
        costoEstimado: costoEstimado != null && costoEstimado !== '' ? Number(costoEstimado) : null,
        roiEstimado: roiEstimado || null,
        ...(color ? { color } : {}),
      },
    })
    return NextResponse.json({ ...iniciativa, tecnologias: parseTec(iniciativa.tecnologias) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const role = (token as { role?: string })?.role
  if (role !== 'SUPERADMIN') {
    return NextResponse.json(
      { error: 'Solo el Super Admin puede eliminar iniciativas. Envía una solicitud de eliminación.' },
      { status: 403 },
    )
  }

  const { id } = await params
  try {
    await prisma.iniciativa.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
