import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const leadId = searchParams.get('leadId')
  if (!leadId) return NextResponse.json({ error: 'leadId requerido' }, { status: 400 })

  const phases = await prisma.leadHub.findMany({
    where: { leadId },
    include: {
      files: {
        select: { id: true, name: true, size: true, mimeType: true, uploadedBy: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(phases)
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { leadId, phase, content } = await request.json()
  const userName = (token as any).name ?? (token as any).email ?? 'unknown'

  const hub = await prisma.leadHub.upsert({
    where:  { leadId_phase: { leadId, phase } },
    update: { content, updatedBy: userName },
    create: { leadId, phase, content, updatedBy: userName },
    include: {
      files: {
        select: { id: true, name: true, size: true, mimeType: true, uploadedBy: true, createdAt: true },
      },
    },
  })

  return NextResponse.json(hub)
}
