import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const sessions = await prisma.sessionLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, action, success, details } = body;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const session = await prisma.sessionLog.create({
      data: {
        userId: userId || null,
        email: email || null,
        action: action || 'LOGOUT',
        ip,
        userAgent,
        success: success !== false,
        details: details || null,
      },
    });

    return NextResponse.json(session);
  } catch (e) {
    console.error('POST /api/sessions error:', e);
    return NextResponse.json({ error: 'Failed to log session' }, { status: 500 });
  }
}
