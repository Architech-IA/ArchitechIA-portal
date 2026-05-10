import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const userName = (token as any).name ?? (token as any).email ?? 'unknown'
  const { hubId, name, mimeType, base64 } = await request.json()

  const size = Math.round((base64.length * 3) / 4)
  if (size > MAX_SIZE) {
    return NextResponse.json({ error: 'Archivo muy grande (máx 5MB)' }, { status: 400 })
  }

  const file = await prisma.leadHubFile.create({
    data: { hubId, name, size, mimeType, base64, uploadedBy: userName },
    select: { id: true, name: true, size: true, mimeType: true, uploadedBy: true, createdAt: true },
  })

  return NextResponse.json(file)
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await request.json()
  await prisma.leadHubFile.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const file = await prisma.leadHubFile.findUnique({ where: { id } })
  if (!file) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json(file)
}
