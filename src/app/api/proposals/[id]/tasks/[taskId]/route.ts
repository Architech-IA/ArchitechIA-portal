import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params;
  const body = await _request.json();
  const task = await prisma.proposalTask.update({
    where: { id: taskId },
    data: { completed: body.completed },
  });
  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await params;
  await prisma.proposalTask.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
