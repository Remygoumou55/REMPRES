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

function persistServerLog(): void {
  // TODO: Réactiver quand une table `server_logs` sera créée dans Supabase.
  //
  // La table visée (`logs`) n'existe pas dans le schéma actuel (seule `activity_logs`
  // existe, avec un schéma différent : action_key, module_key, etc.).
  // Chaque appel faisait un POST silencieusement échoué.
  //
  // Pour activer : créer la migration SQL suivante dans supabase/sql/ :
  //   CREATE TABLE IF NOT EXISTS server_logs (
  //     id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  //     level      text NOT NULL,
  //     module     text NOT NULL,
  //     message    text NOT NULL,
  //     metadata   jsonb DEFAULT '{}',
  //     user_id    uuid REFERENCES auth.users(id),
  //     created_at timestamptz DEFAULT now()
  //   );
  //   ALTER TABLE server_logs ENABLE ROW LEVEL SECURITY;
  //   CREATE POLICY "service_role_only" ON server_logs FOR ALL USING (auth.role() = 'service_role');
  return;
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
  persistServerLog();
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
