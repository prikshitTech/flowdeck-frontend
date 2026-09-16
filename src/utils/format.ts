const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatDate(value: string | null | undefined): string {
  return value ? dateFormatter.format(new Date(value)) : '—';
}

export function formatTime(value: string): string {
  return timeFormatter.format(new Date(value));
}

export function timeAgo(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const size = Math.abs(seconds);

  if (size < MINUTE) {
    return 'just now';
  }

  if (size < HOUR) {
    return relativeFormatter.format(Math.round(seconds / MINUTE), 'minute');
  }

  if (size < DAY) {
    return relativeFormatter.format(Math.round(seconds / HOUR), 'hour');
  }

  if (size < 7 * DAY) {
    return relativeFormatter.format(Math.round(seconds / DAY), 'day');
  }

  return formatDate(value);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

export function personId(person: { id?: string; _id?: string } | null | undefined): string {
  return person?.id ?? person?._id ?? '';
}
