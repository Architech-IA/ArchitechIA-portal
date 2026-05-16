import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { fetchAccounts } from '@/lib/belvo'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const accounts = await prisma.belvoAccount.findMany({
    include: { link: { select: { institution: true } } },
    orderBy: { syncedAt: 'desc' },
  })
  return NextResponse.json(accounts)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { linkId } = await request.json()
  const link = await prisma.belvoLink.findUnique({ where: { id: linkId } })
  if (!link) return NextResponse.json({ error: 'Link no encontrado' }, { status: 404 })

  try {
    const belvoAccounts = await fetchAccounts(link.belvoLinkId)
    const accounts = Array.isArray(belvoAccounts) ? belvoAccounts : belvoAccounts.results ?? []

    const saved = []
    for (const acc of accounts) {
      const balance = acc.balance?.current ?? acc.balance?.available ?? 0
      const creditData = acc.credit_data ? JSON.stringify(acc.credit_data) : null

      const account = await prisma.belvoAccount.upsert({
        where:  { belvoAccountId: acc.id },
        update: { balance, name: acc.name, type: acc.type, currency: acc.currency ?? 'COP', creditData, syncedAt: new Date() },
        create: { belvoAccountId: acc.id, linkId: link.id, institution: link.institution, name: acc.name, type: acc.type, currency: acc.currency ?? 'COP', balance, creditData },
      })
      saved.push(account)
    }

    return NextResponse.json({ synced: saved.length, accounts: saved })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
