import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { fetchTransactions, parseInstallments, daysAgo, today } from '@/lib/belvo'

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { accountId, days = 90 } = await request.json()

  const account = await prisma.belvoAccount.findUnique({
    where: { id: accountId },
    include: { link: true },
  })
  if (!account) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  try {
    const dateFrom = daysAgo(days)
    const dateTo   = today()

    const belvoTxs = await fetchTransactions(account.link.belvoLinkId, account.belvoAccountId, dateFrom, dateTo)
    const txs = Array.isArray(belvoTxs) ? belvoTxs : belvoTxs.results ?? []

    let created = 0
    for (const tx of txs) {
      const desc = tx.description ?? ''
      const installments = parseInstallments(desc)
      const merchant = tx.merchant?.name ?? null

      await prisma.belvoTransaction.upsert({
        where:  { belvoTxId: tx.id },
        update: {},
        create: {
          belvoTxId:         tx.id,
          accountId:         account.id,
          amount:            Math.abs(tx.amount ?? 0),
          currency:          tx.currency ?? 'COP',
          description:       desc,
          category:          tx.category ?? null,
          type:              tx.type ?? 'OUTFLOW',
          status:            tx.status ?? 'PROCESSED',
          valueDate:         tx.value_date ?? tx.accounting_date ?? dateTo,
          installmentNumber: installments?.current ?? null,
          installmentTotal:  installments?.total ?? null,
          merchant,
          rawData:           JSON.stringify(tx),
        },
      })
      created++
    }

    return NextResponse.json({ synced: created, dateFrom, dateTo })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
