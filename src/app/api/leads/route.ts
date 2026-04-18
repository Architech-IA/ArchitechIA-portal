import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET() {
  const leads = await prisma.lead.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(leads);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { companyName, contactName, email, phone, status, source, estimatedValue, notes, userId } = body;

  const lead = await prisma.lead.create({
    data: { companyName, contactName, email, phone, status, source,
      estimatedValue: parseFloat(estimatedValue) || 0, notes, userId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({
    type: 'CREATED', description: `creó el lead ${companyName}`,
    entityType: 'lead', entityId: lead.id, userId, leadId: lead.id,
  });

  return NextResponse.json(lead);
}
