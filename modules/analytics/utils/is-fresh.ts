export function isTimestampFresh(iso: string, maxAgeSeconds: number, now = Date.now()): boolean {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= maxAgeSeconds * 1000;
}
