import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const accountId = searchParams.get('accountId')
  const type      = searchParams.get('type')
  const cuotas    = searchParams.get('cuotas') === 'true'

  const where: any = {}
  if (accountId) where.accountId = accountId
  if (type)      where.type = type
  if (cuotas)    where.installmentTotal = { gt: 1 }

  const txs = await prisma.belvoTransaction.findMany({
    where,
    include: { account: { select: { name: true, institution: true } } },
    orderBy: { valueDate: 'desc' },
    take: 200,
  })

  return NextResponse.json(txs)
}
