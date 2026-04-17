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
  const { companyName, contactName, email, phone, status, source, estimatedValue, notes, userId } = body;

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        companyName,
        contactName,
        email,
        phone: phone || null,
        status,
        source,
        estimatedValue: parseFloat(estimatedValue) || 0,
        notes: notes || null,
        userId,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(lead);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar el lead' }, { status: 500 });
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
    await prisma.activity.deleteMany({ where: { leadId: id } });
    await prisma.proposal.updateMany({ where: { leadId: id }, data: { leadId: null } });
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar el lead' }, { status: 500 });
  }
}
