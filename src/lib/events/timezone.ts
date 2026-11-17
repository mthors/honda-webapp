export const JAKARTA_TIMEZONE = 'Asia/Jakarta';

/**
 * Returns date components in the Asia/Jakarta timezone.
 */
export function getJakartaDateParts(dateInput: Date | string | number): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number;
  minutes: number;
  dateKey: string; // YYYY-MM-DD
} {
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);

  // Format into en-CA (YYYY-MM-DD) in Asia/Jakarta
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Format hours and minutes in Asia/Jakarta (24-hour clock)
  const timeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: JAKARTA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  return {
    year,
    month,
    day,
    hours,
    minutes,
    dateKey: `${yearStr}-${monthStr}-${dayStr}`,
  };
}

/**
 * Converts local Jakarta date ('YYYY-MM-DD') and time ('HH:mm') inputs to an ISO UTC string.
 */
export function jakartaToIsoString(dateStr: string, timeStr: string): string {
  // If timeStr is missing seconds, append :00
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  // Asia/Jakarta is fixed UTC+07:00
  const offsetString = '+07:00';
  const isoLocal = `${dateStr}T${normalizedTime}${offsetString}`;
  return new Date(isoLocal).toISOString();
}

/**
 * Formats a timestamp into an Indonesian date string in Asia/Jakarta.
 * e.g. "20 November 2026"
 */
export function formatJakartaDate(
  dateInput: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
): string {
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIMEZONE,
    ...options,
  }).format(date);
}

/**
 * Formats a timestamp into Indonesian time string in Asia/Jakarta.
 * e.g. "09:00 WIB"
 */
export function formatJakartaTime(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  const time = new Intl.DateTimeFormat('id-ID', {
    timeZone: JAKARTA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
  return `${time.replace('.', ':')} WIB`;
}

/**
 * Formats a complete event date-time range in Asia/Jakarta.
 * Handles same-day vs multi-day formatting gracefully.
 */
export function formatJakartaDateRange(
  startInput: Date | string | number,
  endInput: Date | string | number
): string {
  const startParts = getJakartaDateParts(startInput);
  const endParts = getJakartaDateParts(endInput);
  const startTime = formatJakartaTime(startInput);
  const endTime = formatJakartaTime(endInput);

  if (startParts.dateKey === endParts.dateKey) {
    const formattedDate = formatJakartaDate(startInput);
    return `${formattedDate}, ${startTime} - ${endTime}`;
  }

  const formattedStartDate = formatJakartaDate(startInput, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedEndDate = formatJakartaDate(endInput, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `${formattedStartDate} (${startTime}) - ${formattedEndDate} (${endTime})`;
}

/**
 * Generates an array of all YYYY-MM-DD date keys covered by the event in Asia/Jakarta timezone.
 */
export function getEventDateKeys(
  startInput: Date | string | number,
  endInput: Date | string | number
): string[] {
  const startParts = getJakartaDateParts(startInput);
  const endParts = getJakartaDateParts(endInput);

  const keys: string[] = [];

  // Iterate day by day in UTC based on calendar dates
  let cur = new Date(Date.UTC(startParts.year, startParts.month - 1, startParts.day));
  const end = new Date(Date.UTC(endParts.year, endParts.month - 1, endParts.day));

  while (cur <= end) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    const d = String(cur.getUTCDate()).padStart(2, '0');
    keys.push(`${y}-${m}-${d}`);
    cur = new Date(cur.getTime() + 86400000);
  }

  return keys;
}
