// Open-Meteo returns local dates and times as strings ("2026-09-24", "2026-09-24T15:00").
// We format them as they are, without converting time zones.

export function weekday(date: string): string {
  return new Date(`${date}T12:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
}

export function dayLabel(date: string): string {
  return new Date(`${date}T12:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function hourOf(time: string): string {
  return time.slice(11, 13);
}
