export function formatMoneyGnf(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} GNF`;
}
