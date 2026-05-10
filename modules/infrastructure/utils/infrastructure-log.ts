import { logError, logInfo, logWarn } from "@/lib/logger";

export function infraLogInfo(message: string, metadata?: Record<string, unknown>): void {
  logInfo("infrastructure", message, metadata);
}

export function infraLogWarn(message: string, metadata?: Record<string, unknown>): void {
  logWarn("infrastructure", message, metadata);
}

export function infraLogError(message: string, metadata?: Record<string, unknown>): void {
  logError("infrastructure", message, metadata);
}
