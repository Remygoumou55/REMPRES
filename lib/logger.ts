/**
 * lib/logger.ts
 * Logger centralisé pour RemPres.
 *
 * En production, ces logs apparaissent dans Vercel Functions Logs.
 * Structure prête pour l'intégration future d'un service externe
 * (Sentry, Datadog, LogRocket…) en remplaçant uniquement ce fichier.
 *
 * USAGE :
 *   import { logError, logInfo, logWarning } from "@/lib/logger";
 *   logError("SALE_CREATION", error, { userId, saleId });
 */

type LogLevel = "info" | "warning" | "error";

interface LogEntry {
  level:     LogLevel;
  context:   string;
  message:   string;
  data?:     Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Formateur interne
// ---------------------------------------------------------------------------

function formatEntry(entry: LogEntry): string {
  const prefix = {
    info:    "[INFO]   ",
    warning: "[WARN]   ",
    error:   "[ERROR]  ",
  }[entry.level];

  return `${prefix} ${entry.timestamp} | ${entry.context} | ${entry.message}`;
}

function buildEntry(
  level: LogLevel,
  context: string,
  error: unknown,
  data?: Record<string, unknown>,
): LogEntry {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : JSON.stringify(error);

  return {
    level,
    context,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// API publique
// ---------------------------------------------------------------------------

/**
 * Enregistre une erreur (exception ou message).
 * @param context  Identifiant lisible du lieu d'appel (ex: "SALE_CREATION")
 * @param error    L'erreur capturée (Error, string, ou unknown)
 * @param data     Données contextuelles optionnelles (userId, saleId…)
 */
export function logError(
  context: string,
  error: unknown,
  data?: Record<string, unknown>,
): void {
  const entry = buildEntry("error", context, error, data);
  console.error(formatEntry(entry), data ?? "");

  // TODO Phase 7 : envoyer à Sentry / Datadog
  // if (process.env.NODE_ENV === "production") {
  //   Sentry.captureException(error, { extra: { context, ...data } });
  // }
}

/**
 * Enregistre un événement informatif.
 * @param context  Identifiant lisible du lieu d'appel
 * @param message  Message descriptif
 * @param data     Données contextuelles optionnelles
 */
export function logInfo(
  context: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  // Silencieux en production — debug uniquement en développement
  if (process.env.NODE_ENV !== "development") return;
  const entry = buildEntry("info", context, message, data);
  console.info(formatEntry(entry), data ?? "");
}

/**
 * Enregistre un avertissement non bloquant.
 * @param context  Identifiant lisible du lieu d'appel
 * @param message  Message d'avertissement
 * @param data     Données contextuelles optionnelles
 */
export function logWarning(
  context: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  const entry = buildEntry("warning", context, message, data);
  console.warn(formatEntry(entry), data ?? "");
}
