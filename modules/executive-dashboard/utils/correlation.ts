export function createExecutiveCorrelationId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `exec_${t}_${r}`;
}
