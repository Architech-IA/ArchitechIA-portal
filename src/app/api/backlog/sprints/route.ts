import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sprints = await prisma.sprint.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(sprints)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { name, goal, startDate, endDate } = await request.json()
  const sprint = await prisma.sprint.create({
    data: { name, goal: goal || null, startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null, status: 'PLANNED' },
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json(sprint)
}

export async function PUT(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id, status } = await request.json()
  const sprint = await prisma.sprint.update({
    where: { id }, data: { status },
    include: { _count: { select: { items: true } } },
  })
  return NextResponse.json(sprint)
}
