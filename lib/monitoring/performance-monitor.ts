import { monitorLog } from "@/lib/monitoring/logger";

export function nowMs(): number {
  return Date.now();
}

export function reportDuration(
  operation: string,
  startedAtMs: number,
  context: Record<string, unknown> = {},
): void {
  const durationMs = Math.max(0, Date.now() - startedAtMs);
  monitorLog("info", "operation_duration", { operation, durationMs, ...context });
}

export function reportIfSlow(
  operation: string,
  startedAtMs: number,
  thresholdMs: number,
  context: Record<string, unknown> = {},
): void {
  const durationMs = Math.max(0, Date.now() - startedAtMs);
  if (durationMs < thresholdMs) return;
  monitorLog("warn", "slow_operation", {
    operation,
    durationMs,
    thresholdMs,
    ...context,
  });
}
