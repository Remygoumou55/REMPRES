import { logError, logInfo, logWarning } from "@/lib/logger";

type MonitorLevel = "info" | "warn" | "error";

type MonitorPayload = Record<string, unknown>;

const SENSITIVE_KEYS = [
  "access_token",
  "refresh_token",
  "password",
  "authorization",
  "cookie",
] as const;

function isMonitoringEnabled(): boolean {
  const value = String(process.env.NEXT_PUBLIC_MONITORING_ENABLED ?? "true")
    .trim()
    .toLowerCase();
  return value !== "false";
}

function redact(payload: MonitorPayload): MonitorPayload {
  const out: MonitorPayload = {};
  for (const [k, v] of Object.entries(payload)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      out[k] = "[REDACTED]";
      continue;
    }
    out[k] = v;
  }
  return out;
}

export function monitorLog(level: MonitorLevel, event: string, payload: MonitorPayload = {}): void {
  if (!isMonitoringEnabled()) return;
  const safePayload = redact(payload);
  if (level === "error") {
    logError("monitoring", event, safePayload);
    return;
  }
  if (level === "warn") {
    logWarning("monitoring", event, safePayload);
    return;
  }
  logInfo("monitoring", event, safePayload);
}
