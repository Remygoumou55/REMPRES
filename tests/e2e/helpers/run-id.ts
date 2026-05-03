/** Identifiants uniques par exécution (évite collisions SKU / email en QA). */
export function e2eRunId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
