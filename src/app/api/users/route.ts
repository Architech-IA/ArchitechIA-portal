import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

const SUPERADMIN_EMAIL = 'admin@architechia.co'

async function requireAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = (token as { role?: string })?.role
  if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }), token: null }
  }
  return { error: null, token }
}

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, password, role } = body;

  // Nadie puede crear otro SUPERADMIN
  if (role === 'SUPERADMIN') {
    return NextResponse.json({ error: 'El rol SUPERADMIN es único y no puede asignarse' }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: { name, email, password, role },
    select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const { error, token } = await requireAdmin(request);
  if (error) return error;

  const { id, name, email, role } = await request.json();

  // Proteger al SUPERADMIN
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (target?.role === 'SUPERADMIN') {
    return NextResponse.json({ error: 'El Super Admin no puede ser modificado' }, { status: 403 });
  }

  // Nadie puede asignar SUPERADMIN
  if (role === 'SUPERADMIN') {
    return NextResponse.json({ error: 'El rol SUPERADMIN no puede asignarse' }, { status: 403 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data:  { name, email, role },
      select: { id: true, name: true, email: true, role: true, avatar: true, createdAt: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { error, token } = await requireAdmin(request);
  if (error) return error;

  const { id } = await request.json();

  // Proteger al SUPERADMIN
  const target = await prisma.user.findUnique({ where: { id }, select: { email: true, role: true } });
  if (target?.role === 'SUPERADMIN' || target?.email === SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: 'El Super Admin no puede ser eliminado' }, { status: 403 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
