const FR_MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getISOWeekYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

export function getWeekBounds(
  weekNumber: number,
  year: number,
): { start: Date; end: Date } {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (weekNumber - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return { start: weekStart, end: weekEnd };
}

export function formatWeekRangeLabel(week: number, year: number): string {
  const { start, end } = getWeekBounds(week, year);
  const fmt = (d: Date) => `${d.getDate()} ${FR_MONTHS_SHORT[d.getMonth()]}`;
  return `Semaine ${week} · ${fmt(start)} – ${fmt(end)} ${year}`;
}

export function listRecentIsoWeeks(
  count: number,
  anchor: Date = new Date(),
): { week: number; year: number }[] {
  const items: { week: number; year: number }[] = [];
  const cursor = new Date(anchor);
  for (let i = 0; i < count; i++) {
    items.push({
      week: getISOWeek(cursor),
      year: getISOWeekYear(cursor),
    });
    cursor.setDate(cursor.getDate() - 7);
  }
  return items;
}
