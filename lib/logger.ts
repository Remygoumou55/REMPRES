type LogLevel = "info" | "warn" | "error";

type LogMetadata = Record<string, unknown>;

type LogPayload = {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  userId: string | null;
  metadata?: LogMetadata;
  runtime: "client" | "server";
};

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "cookie",
  "secret",
]);

function detectRuntime(): "client" | "server" {
  return typeof window === "undefined" ? "server" : "client";
}

function toMessage(input: unknown): string {
  if (input instanceof Error) return input.message;
  if (typeof input === "string") return input;
  try {
    return JSON.stringify(input);
  } catch {
    return "Unknown error";
  }
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sanitizeValue);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = sanitizeValue(v);
    }
  }
  return out;
}

function emit(payload: LogPayload): void {
  const line = `[${payload.level.toUpperCase()}] ${payload.timestamp} | ${payload.module} | ${payload.message}`;

  if (payload.level === "error") {
    console.error(line, payload);
    return;
  }
  if (payload.level === "warn") {
    console.warn(line, payload);
    return;
  }
  console.info(line, payload);
}

function persistServerLog(payload: LogPayload): void {
  if (payload.runtime !== "server") return;
  if (payload.level === "info") return; // keep persistence lightweight

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/logs`;
  const body = {
    level: payload.level,
    module: payload.module,
    message: payload.message,
    metadata: payload.metadata ?? {},
    user_id: payload.userId,
  };

  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  }).catch(() => {
    // Never throw from logger path.
  });
}

function write(
  level: LogLevel,
  module: string,
  message: unknown,
  metadata?: LogMetadata,
): void {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message: toMessage(message),
    userId: typeof metadata?.userId === "string" ? metadata.userId : null,
    metadata: sanitizeValue(metadata) as LogMetadata | undefined,
    runtime: detectRuntime(),
  };
  emit(payload);
  persistServerLog(payload);
}

export function logInfo(
  module: string,
  message: string,
  metadata?: LogMetadata,
): void {
  write("info", module, message, metadata);
}

export function logWarn(
  module: string,
  message: string,
  metadata?: LogMetadata,
): void {
  write("warn", module, message, metadata);
}

// Backward compatibility with old name.
export const logWarning = logWarn;

export function logError(
  module: string,
  error: unknown,
  metadata?: LogMetadata,
): void {
  write("error", module, error, metadata);
}
