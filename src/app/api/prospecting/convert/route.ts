import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const userId = token.sub as string
  const { places } = await request.json()

  if (!places?.length) {
    return NextResponse.json({ error: 'No se enviaron prospectos' }, { status: 400 })
  }

  const created = []
  const skipped = []

  for (const place of places) {
    // Evitar duplicados por nombre de empresa
    const exists = await prisma.lead.findFirst({
      where: { companyName: { equals: place.name, mode: 'insensitive' } },
    })

    if (exists) {
      skipped.push(place.name)
      continue
    }

    const notes = [
      place.address ? `Dirección: ${place.address}` : '',
      place.website ? `Web: ${place.website}` : '',
      place.rating   ? `Rating Google: ${place.rating}/5 (${place.totalRatings} reseñas)` : '',
      place.types?.length ? `Tipo: ${place.types.slice(0, 3).join(', ')}` : '',
    ].filter(Boolean).join('\n')

    const lead = await prisma.lead.create({
      data: {
        companyName:    place.name,
        contactName:    '',
        email:          '',
        phone:          place.phone || null,
        status:         'NEW',
        source:         'GOOGLE_PLACES',
        estimatedValue: 0,
        notes:          notes || null,
        userId,
      },
    })

    await logActivity({
      type:        'CREATED',
      description: `creó el lead ${place.name} desde Lead Prospector`,
      entityType:  'lead',
      entityId:    lead.id,
      userId,
      leadId:      lead.id,
    })

    created.push(lead)
  }

  return NextResponse.json({
    created: created.length,
    skipped: skipped.length,
    skippedNames: skipped,
  })
}
