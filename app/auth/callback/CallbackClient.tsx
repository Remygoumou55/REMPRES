"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { logError } from "@/lib/logger";
import { buildAuthErrorHref, mapAuthCallbackError } from "@/lib/auth/callback-errors";
import { reportRouteError } from "@/lib/monitoring/error-monitor";
import { getPostLoginDestinationFromProfile } from "@/lib/roleRedirects";
import type { SupabaseClient } from "@supabase/supabase-js";

function readExplicitNext(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  return raw.startsWith("/") ? raw : null;
}

async function resolveAuthCallbackDestination(
  supabase: SupabaseClient,
  explicitNext: string | null,
): Promise<string> {
  if (explicitNext && explicitNext !== "/dashboard") {
    return explicitNext;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_key, system_authority, department_key")
    .eq("id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  return getPostLoginDestinationFromProfile(profile);
}

function readMode(type: string | null): "invite" | "recovery" | "default" {
  if (type === "invite") return "invite";
  if (type === "recovery") return "recovery";
  return "default";
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function CallbackClient() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectedRef = useRef(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    async function run() {
      const paramError = params.get("error");
      const paramErrorDesc = params.get("error_description");
      if (paramError) {
        reportRouteError("/auth/callback", new Error(paramErrorDesc ?? paramError), {
          stage: "query_param_error",
        });
        router.replace(buildAuthErrorHref(mapAuthCallbackError(paramError, paramErrorDesc)));
        return;
      }

      const type = readMode(params.get("type"));
      const code = params.get("code");
      const explicitNext = readExplicitNext(params.get("next"));

      try {
        const hash = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hash);
        const hashError = hashParams.get("error");
        const hashErrorDesc = hashParams.get("error_description");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (hashError) {
          reportRouteError("/auth/callback", new Error(hashErrorDesc ?? hashError), {
            stage: "hash_param_error",
          });
          router.replace(buildAuthErrorHref(mapAuthCallbackError(hashError, hashErrorDesc)));
          return;
        }

        // Priorité au hash fragment (flux invite Supabase classique),
        // sinon fallback sur code PKCE.
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        }

        // Tolérance aux races de cookies/session hydration.
        let sessionReady = false;
        for (let i = 0; i < 8; i += 1) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            sessionReady = true;
            break;
          }
          await delay(150);
        }

        if (!sessionReady) {
          router.replace(buildAuthErrorHref("Lien invalide"));
          return;
        }

        if (cancelled || redirectedRef.current) return;
        redirectedRef.current = true;

        if (type === "invite") {
          router.replace("/auth/set-password");
        } else if (type === "recovery") {
          router.replace("/auth/set-password?mode=recovery");
        } else {
          const dest = await resolveAuthCallbackDestination(supabase, explicitNext);
          router.replace(dest);
        }
      } catch (error) {
        logError("AUTH_CALLBACK_CLIENT", error, {
          code: params.get("code") ?? undefined,
          type: params.get("type") ?? undefined,
        });
        reportRouteError("/auth/callback", error, {
          code: params.get("code") ?? undefined,
          type: params.get("type") ?? undefined,
        });
        if (!cancelled) {
          const msg =
            error instanceof Error
              ? mapAuthCallbackError(error.name, error.message)
              : "Erreur lors de l'invitation";
          router.replace(buildAuthErrorHref(msg));
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
        <Loader2 size={16} className="animate-spin" />
        Finalisation de la connexion...
      </div>
    </main>
  );
}
