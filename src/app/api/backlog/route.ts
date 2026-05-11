import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.backlogItem.findMany({
    include: { sprint: { select: { id: true, name: true } } },
    orderBy: [{ status: 'asc' }, { priority: 'asc' }, { order: 'asc' }],
  })
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { title, description, type, priority, status, points, sprintId, assigneeId, assigneeName } = body

  const item = await prisma.backlogItem.create({
    data: { title, description: description || null, type, priority, status: status || 'BACKLOG',
      points: points ? Number(points) : null, sprintId: sprintId || null,
      assigneeId: assigneeId || null, assigneeName: assigneeName || null },
    include: { sprint: { select: { id: true, name: true } } },
  })
  return NextResponse.json(item)
}
