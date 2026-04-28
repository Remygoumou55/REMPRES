import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

let adminClient: SupabaseClient<Database> | null = null;

type EnvKey = "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY";

function readSupabaseAdminEnv(): { url: string; serviceKey: string; missing: EnvKey[] } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const missing: EnvKey[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return { url, serviceKey, missing };
}

/** Erreur explicite (ops / logs) quand l’environnement admin n’est pas chargé. */
export function getSupabaseAdminConfigErrorMessage(): string | null {
  const { missing } = readSupabaseAdminEnv();
  if (missing.length === 0) return null;
  return `[getSupabaseAdmin] Required environment variable(s) missing: ${missing.join(
    ", ",
  )}. Set them in .env.local (local) or the host (e.g. Vercel) project settings. The service role key must never be exposed to the browser.`;
}

/**
 * Client Supabase **admin** (service role) — serveur uniquement, jamais import côté client.
 * Préférer celui-ci à l’API publique (anon) pour inviter des utilisateurs, l’auth admin, etc.
 */
export function getSupabaseAdmin() {
  const { url, serviceKey, missing } = readSupabaseAdminEnv();
  if (missing.length > 0) {
    const detail = getSupabaseAdminConfigErrorMessage() ?? "Supabase admin configuration error.";
    throw new Error(detail);
  }

  if (!adminClient) {
    adminClient = createClient<Database>(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

/** Même instance que getSupabaseAdmin() (compat modules existants). */
export function getSupabaseAdminClient(): SupabaseClient<Database> {
  return getSupabaseAdmin();
}
