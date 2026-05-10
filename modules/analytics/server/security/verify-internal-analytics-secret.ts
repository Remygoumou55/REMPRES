const HEADER = "x-internal-analytics-secret";

export function verifyInternalAnalyticsSecret(request: Request): boolean {
  const secret = process.env.INTERNAL_ANALYTICS_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get(HEADER)?.trim();
  return header === secret;
}
