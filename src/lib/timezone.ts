/**
 * Utility functions for UTC-5 timezone handling.
 * All dates in the system are stored in UTC but represent UTC-5 local time.
 */

const UTC5_OFFSET = '-05:00';

/** Parse a datetime-local string as UTC-5 and return a Date in UTC */
export function parseUTC5(dateStr: string): Date {
  return new Date(dateStr + UTC5_OFFSET);
}

/** Parse a datetime-local string as UTC-5, return null if empty */
export function parseUTC5Nullable(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  return parseUTC5(dateStr);
}

/** Format a Date for a datetime-local input using LOCAL time components */
export function toDatetimeLocalInput(date: Date | string): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
