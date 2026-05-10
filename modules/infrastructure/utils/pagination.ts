/** Fenêtre stable pour gros jeux (curseur UUID ou timestamp ISO). */
export type CursorPageParams = {
  cursor?: string | null;
  limit?: number;
};

export function clampPageLimit(limit: number | undefined, max = 500): number {
  const n = Number(limit ?? max);
  if (!Number.isFinite(n)) return max;
  return Math.min(Math.max(1, Math.floor(n)), max);
}
