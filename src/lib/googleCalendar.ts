import { prisma } from '@/lib/prisma';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

async function refreshAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.googleRefreshToken) return null;

  try {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: user.googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: data.access_token,
        googleTokenExpiry: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      },
    });

    return data.access_token;
  } catch {
    return null;
  }
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.googleAccessToken) return null;

  if (user.googleTokenExpiry && new Date() < user.googleTokenExpiry) {
    return user.googleAccessToken;
  }

  return refreshAccessToken(userId);
}

export async function createCalendarEvent(
  userId: string,
  meetingId: string,
  title: string,
  description: string | null,
  date: Date,
  endDate: Date | null,
  location: string | null,
  attendees: string | null,
  link: string | null,
): Promise<string | null> {
  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return null;

  const eventEnd = endDate || new Date(date.getTime() + 60 * 60 * 1000);
  const attendeeList = attendees
    ? attendees.split(',').map(a => a.trim()).filter(Boolean).map(email => ({ email }))
    : [];

  const body: Record<string, unknown> = {
    summary: title,
    start: { dateTime: date.toISOString(), timeZone: 'America/Bogota' },
    end: { dateTime: eventEnd.toISOString(), timeZone: 'America/Bogota' },
    attendees: attendeeList,
  };

  if (description) body.description = description;
  if (location) body.location = location;
  if (link) body.description = `${body.description ? body.description + '\n\n' : ''}Enlace: ${link}`;

  try {
    const res = await fetch(`${GOOGLE_CALENDAR_URL}?sendUpdates=all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('Google Calendar create error:', await res.text());
      return null;
    }

    const data = await res.json();
    const eventId = data.id as string;

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { googleEventId: eventId },
    });

    return eventId;
  } catch (e) {
    console.error('Google Calendar create exception:', e);
    return null;
  }
}

export async function updateCalendarEvent(
  userId: string,
  meetingId: string,
  title: string,
  description: string | null,
  date: Date,
  endDate: Date | null,
  location: string | null,
  attendees: string | null,
  link: string | null,
  status: string,
): Promise<void> {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting?.googleEventId) return;

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return;

  const eventEnd = endDate || new Date(date.getTime() + 60 * 60 * 1000);
  const attendeeList = attendees
    ? attendees.split(',').map(a => a.trim()).filter(Boolean).map(email => ({ email }))
    : [];

  const body: Record<string, unknown> = {
    summary: title,
    start: { dateTime: date.toISOString(), timeZone: 'America/Bogota' },
    end: { dateTime: eventEnd.toISOString(), timeZone: 'America/Bogota' },
    attendees: attendeeList,
  };

  if (description) body.description = description;
  if (location) body.location = location;
  if (link) body.description = `${body.description ? body.description + '\n\n' : ''}Enlace: ${link}`;
  if (status === 'CANCELLED') body.description = `[CANCELADA]\n${body.description || ''}`;

  try {
    await fetch(`${GOOGLE_CALENDAR_URL}/${meeting.googleEventId}?sendUpdates=all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error('Google Calendar update exception:', e);
  }
}

export async function deleteCalendarEvent(userId: string, meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting?.googleEventId) return;

  const accessToken = await getValidAccessToken(userId);
  if (!accessToken) return;

  try {
    await fetch(`${GOOGLE_CALENDAR_URL}/${meeting.googleEventId}?sendUpdates=all`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
  } catch (e) {
    console.error('Google Calendar delete exception:', e);
  }
}
