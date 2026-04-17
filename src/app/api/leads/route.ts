import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    data: {
      companyName,
      contactName,
      email,
      phone,
      status,
      source,
      estimatedValue: parseFloat(estimatedValue) || 0,
      notes,
      userId,
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(lead);
}
