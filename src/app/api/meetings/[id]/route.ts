import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUTC5, parseUTC5Nullable } from '@/lib/timezone';
import { updateCalendarEvent, deleteCalendarEvent } from '@/lib/googleCalendar';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, description, type, date, endDate, location, link, attendees, status, notes, actaFile, actaFileName } = body;

  try {
    const existing = await prisma.meeting.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title, description, type,
        date: date ? parseUTC5(date) : undefined,
        endDate: endDate ? parseUTC5Nullable(endDate) : null,
        location: location || null,
        link: link || null,
        attendees: attendees || null,
        status,
        notes: notes || null,
        actaFile: actaFile !== undefined ? (actaFile || null) : undefined,
        actaFileName: actaFileName !== undefined ? (actaFileName || null) : undefined,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    updateCalendarEvent(
      existing.userId,
      meeting.id,
      meeting.title,
      meeting.description,
      meeting.date,
      meeting.endDate,
      meeting.location,
      meeting.attendees,
      meeting.link,
      meeting.status,
    ).catch(() => {});

    return NextResponse.json(meeting);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

    deleteCalendarEvent(meeting.userId, meeting.id).catch(() => {});

    await prisma.meeting.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
