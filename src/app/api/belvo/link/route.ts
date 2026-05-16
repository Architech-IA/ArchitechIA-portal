import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { createLink, listLinks, deleteLink } from '@/lib/belvo'

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const links = await prisma.belvoLink.findMany({
    include: { _count: { select: { accounts: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(links)
}

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { institution, username, password } = await request.json()
  if (!institution || !username || !password)
    return NextResponse.json({ error: 'institution, username y password son requeridos' }, { status: 400 })

  try {
    const belvoLink = await createLink(institution, username, password)

    const link = await prisma.belvoLink.upsert({
      where:  { belvoLinkId: belvoLink.id },
      update: { status: belvoLink.status, institution },
      create: { belvoLinkId: belvoLink.id, institution, status: belvoLink.status ?? 'valid' },
    })

    return NextResponse.json({ link, belvoLink })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { linkId } = await request.json()
  const link = await prisma.belvoLink.findUnique({ where: { id: linkId } })
  if (!link) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await deleteLink(link.belvoLinkId)
  await prisma.belvoLink.delete({ where: { id: linkId } })
  return NextResponse.json({ ok: true })
}
