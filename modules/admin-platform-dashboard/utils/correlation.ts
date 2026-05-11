export function createAdminPlatformCorrelationId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `apd_${t}_${r}`;
}
