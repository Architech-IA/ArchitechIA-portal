import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return (token as { role?: string })?.role === 'ADMIN';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, amount, leadId, userId, sentDate } = body;
  try {
    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        title,
        description,
        status,
        amount: parseFloat(amount) || 0,
        leadId: leadId || null,
        userId,
        sentDate: sentDate ? new Date(sentDate) : null,
      },
      include: { lead: true, user: { select: { id: true, name: true, email: true } } },
    });
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
