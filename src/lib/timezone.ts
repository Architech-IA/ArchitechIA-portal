/**
 * Utility functions for UTC-5 timezone (America/Bogota).
 * All dates are stored in UTC but displayed in UTC-5 via explicit timeZone.
 */

const TIMEZONE = 'America/Bogota';
const UTC5_OFFSET = '-05:00';

export function parseUTC5(dateStr: string): Date {
  return new Date(dateStr + UTC5_OFFSET);
}

export function parseUTC5Nullable(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  return parseUTC5(dateStr);
}

export function toDatetimeLocalInput(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getDateStrUTC5(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(date));
}

export function getTodayStrUTC5(): string {
  return getDateStrUTC5(new Date());
}

export function getTimeStrUTC5(date: Date | string): string {
  return new Date(date).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  });
}

export function getDateFullUTC5(date: Date | string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: TIMEZONE,
  });
}

export function getDayUTC5(date: Date | string): number {
  return parseInt(new Intl.DateTimeFormat('en-US', {
    day: 'numeric', timeZone: TIMEZONE,
  }).format(new Date(date)), 10);
}

export function getWeekdayDateUTC5(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00-05:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: TIMEZONE,
  });
}
