/**
 * app/auth/callback/route.ts
 *
 * Réception OAuth / PKCE (invitation, reset mot de passe, confirmation email).
 * Utilise createServerClient + cookies pour que la session soit persistée dans le navigateur.
 *
 * Ne jamais laisser d’exception remonter : redirection vers /auth/error avec message lisible.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database.types";
import { logError } from "@/lib/logger";

/** PKCE / URL courante — jamais en statique. */
export const dynamic = "force-dynamic";

/**
 * Messages utilisateur final (aucune ambiguïté) — codes / textes Supabase GoTrue.
 * Ordre : expiré → déjà utilisé → invalide → défaut.
 */
function mapAuthError(error?: string | null, description?: string | null): string {
  const text = `${error ?? ""} ${description ?? ""}`.toLowerCase();

  if (
    text.includes("expired")
    || text.includes("expir")
    || text.includes("otp_expired")
  ) {
    return "Invitation expirée";
  }
  if (
    text.includes("used")
    || text.includes("already")
    || text.includes("redeemed")
    || text.includes("consumed")
  ) {
    return "Invitation déjà utilisée";
  }
  if (text.includes("invalid") || text.includes("malformed") || text.includes("bad_code")) {
    return "Lien invalide";
  }

  return "Erreur lors de l'invitation";
}

function redirectAuthError(request: NextRequest, message: string): NextResponse {
  const base = new URL(request.url).origin;
  const target = new URL("/auth/error", base);
  target.searchParams.set("message", message);
  return NextResponse.redirect(target);
}

/** Copier les cookies de session sur la redirection finale (SSR Supabase). */
function redirectWithCookies(
  from: NextResponse,
  targetUrl: string,
): NextResponse {
  const out = NextResponse.redirect(targetUrl);
  from.cookies.getAll().forEach((cookie) => {
    out.cookies.set(cookie.name, cookie.value);
  });
  return out;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);

    const urlError = searchParams.get("error");
    const urlErrorDesc = searchParams.get("error_description");

    if (urlError) {
      logError("AUTH_CALLBACK_OAUTH_PARAM", new Error(urlErrorDesc || urlError), {
        step: "oauth_redirect_params",
        error: urlError,
        error_description: urlErrorDesc ?? undefined,
        userMessage: mapAuthError(urlError, urlErrorDesc),
      });
      return redirectAuthError(request, mapAuthError(urlError, urlErrorDesc));
    }

    const code = searchParams.get("code");
    if (!code) {
      logError(
        "AUTH_CALLBACK_MISSING_CODE",
        new Error("Missing authorization code in callback URL"),
        { step: "preflight", hasErrorParam: false },
      );
      return redirectAuthError(request, "Lien invalide");
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    ) {
      logError(
        "AUTH_CALLBACK_CONFIG",
        new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        { step: "env", userMessage: "Erreur serveur" },
      );
      return redirectAuthError(request, "Erreur serveur");
    }

    const type = searchParams.get("type");
    const nextPath = searchParams.get("next") ?? "/dashboard";
    const safeNext = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;

    const response = NextResponse.next();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookieList) {
            cookieList.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.session) {
      const codeStr = String((exchangeError as { code?: string } | null)?.code ?? "");
      const msgStr = exchangeError?.message ?? "";

      const userMessage = exchangeError
        ? mapAuthError(codeStr, msgStr)
        : "Erreur serveur";

      logError("AUTH_CALLBACK_EXCHANGE", exchangeError ?? new Error("no session"), {
        step: "exchange_code_for_session",
        hasSession: !!data?.session,
        exchangeCode: codeStr || undefined,
        exchangeMessage: msgStr || undefined,
        userMessage,
      });

      return redirectAuthError(request, userMessage);
    }

    if (type === "invite") {
      return redirectWithCookies(response, `${origin}/auth/set-password`);
    }

    if (type === "recovery") {
      return redirectWithCookies(
        response,
        `${origin}/auth/set-password?mode=recovery`,
      );
    }

    return redirectWithCookies(response, `${origin}${safeNext}`);
  } catch (err) {
    logError("AUTH_CALLBACK_FATAL", err, { step: "unhandled", userMessage: "Erreur serveur" });
    return redirectAuthError(request, "Erreur serveur");
  }
}
