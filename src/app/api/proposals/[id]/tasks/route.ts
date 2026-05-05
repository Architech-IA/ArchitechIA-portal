import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tasks = await prisma.proposalTask.findMany({
    where: { proposalId: id },
    orderBy: [{ completed: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(tasks);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { title } = await request.json();
  const task = await prisma.proposalTask.create({
    data: { title, proposalId: id },
  });
  return NextResponse.json(task);
}
