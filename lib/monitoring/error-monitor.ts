import { monitorLog } from "@/lib/monitoring/logger";

type ErrorContext = Record<string, unknown>;

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "unknown_error");
}

export function reportRouteError(route: string, error: unknown, context: ErrorContext = {}): void {
  monitorLog("error", "route_error", {
    route,
    message: toMessage(error),
    ...context,
  });
}

export function reportMutationError(
  mutation: string,
  error: unknown,
  context: ErrorContext = {},
): void {
  monitorLog("error", "mutation_error", {
    mutation,
    message: toMessage(error),
    ...context,
  });
}

export function reportRealtimeError(channel: string, error: unknown, context: ErrorContext = {}): void {
  monitorLog("warn", "realtime_error", {
    channel,
    message: toMessage(error),
    ...context,
  });
}
