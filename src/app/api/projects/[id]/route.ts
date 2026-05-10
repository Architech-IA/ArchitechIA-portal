import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

const projectInclude = {
  users: { include: { user: { select: { id: true, name: true, email: true } } } },
  milestones: true,
} as const;

async function isAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string })?.role; return role === 'ADMIN' || role === 'SUPERADMIN';
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
  const { name, description, status, priority, progress, repository, startDate, endDate } = body;
  try {
    const prev = await prisma.project.findUnique({ where: { id }, select: { status: true } });
    const project = await prisma.project.update({
      where: { id },
      data: { name, description, status, priority,
        progress: parseInt(progress) || 0,
        repository: repository || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate:   endDate   ? new Date(endDate)   : null },
      include: projectInclude,
    });

    const actorId = (token as { sub?: string })?.sub || 'unknown';
    if (prev?.status !== status) {
      await logActivity({ type: 'STATUS_CHANGED',
        description: `cambió proyecto "${name}" a estado ${status}`,
        entityType: 'project', entityId: id, userId: actorId, projectId: id });
    } else {
      await logActivity({ type: 'UPDATED', description: `actualizó el proyecto "${name}"`,
        entityType: 'project', entityId: id, userId: actorId, projectId: id });
    }

    return NextResponse.json(project);
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
    await prisma.activity.deleteMany({ where: { projectId: id } });
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
