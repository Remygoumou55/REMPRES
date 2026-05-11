/** Identifiant de corrélation léger pour chaîner charts ↔ realtime ↔ exports (sans dépendance crypto navigateur). */
export function createDashboardCorrelationId(prefix = "dbf"): string {
  const time = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}_${rnd}`;
}
