import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stage = new URL(req.url).searchParams.get('stage');
  const docs = await prisma.proposalDocument.findMany({
    where: { proposalId: id, ...(stage ? { stage } : {}) },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(docs);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, url, type, stage } = await request.json();
  const doc = await prisma.proposalDocument.create({
    data: { name, url, type: type || 'file', stage: stage || null, proposalId: id },
  });
  return NextResponse.json(doc);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { docId } = await request.json();
  await prisma.proposalDocument.delete({ where: { id: docId } });
  return NextResponse.json({ ok: true });
}
