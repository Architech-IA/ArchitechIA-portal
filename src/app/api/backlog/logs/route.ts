import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const itemId = request.nextUrl.searchParams.get('itemId')
  if (!itemId) return NextResponse.json({ error: 'itemId requerido' }, { status: 400 })

  const logs = await prisma.backlogItemLog.findMany({
    where:   { itemId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(logs)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { itemId, fromStatus, toStatus, note } = await request.json()
  const userName = (token as any).name ?? (token as any).email ?? 'unknown'

  const log = await prisma.backlogItemLog.create({
    data: { itemId, fromStatus: fromStatus ?? null, toStatus, note: note ?? null, userName },
  })
  return NextResponse.json(log)
}
