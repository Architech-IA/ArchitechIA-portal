import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        lead: true,
        user: { select: { id: true, name: true, email: true } },
        activities: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
    return NextResponse.json(proposal);
  }

  const proposals = await prisma.proposal.findMany({
    include: { lead: true, user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(proposals);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, status, amount, leadId, userId, sentDate } = body;

  const proposal = await prisma.proposal.create({
    data: { title, description, status, amount: parseFloat(amount) || 0,
      leadId, userId, sentDate: sentDate ? new Date(sentDate) : null },
    include: { lead: true, user: { select: { id: true, name: true, email: true } } },
  });

  await logActivity({ type: 'CREATED', description: `creó la propuesta "${title}"`,
    entityType: 'proposal', entityId: proposal.id, userId, proposalId: proposal.id,
    leadId: leadId || null });

  return NextResponse.json(proposal);
}
