/** Point d’extension tracing distribué — noop safe sans importer OpenTelemetry côté bundle UI. */
export async function withInfrastructureSpan<T>(_label: string, fn: () => Promise<T>): Promise<T> {
  return fn();
}
