import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return (token as { role?: string })?.role === 'ADMIN';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, amount, leadId, userId, sentDate } = body;
  try {
    const prev = await prisma.proposal.findUnique({ where: { id }, select: { status: true } });
    const proposal = await prisma.proposal.update({
      where: { id },
      data: { title, description, status, amount: parseFloat(amount) || 0,
        leadId, userId, sentDate: sentDate ? new Date(sentDate) : null },
      include: { lead: true, user: { select: { id: true, name: true, email: true } } },
    });

    const actorId = (token as { sub?: string })?.sub || userId;
    if (prev?.status !== status) {
      await logActivity({ type: 'STATUS_CHANGED',
        description: `cambió propuesta "${title}" a estado ${status}`,
        entityType: 'proposal', entityId: id, userId: actorId, proposalId: id });
    } else {
      await logActivity({ type: 'UPDATED', description: `actualizó la propuesta "${title}"`,
        entityType: 'proposal', entityId: id, userId: actorId, proposalId: id });
    }

    return NextResponse.json(proposal);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id } = await params;
  try {
    await prisma.activity.deleteMany({ where: { proposalId: id } });
    await prisma.proposal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
