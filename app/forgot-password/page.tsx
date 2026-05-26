"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";

import { appConfig, getLogoUrl } from "@/lib/config";
import { logWarn } from "@/lib/logger";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type ResetAuthError = {
  message?: string;
  status?: number;
  name?: string;
};

function mapResetError(authError: ResetAuthError): string {
  const raw = (authError.message ?? "").toLowerCase();
  const status = authError.status ?? 0;

  if (
    status === 429 ||
    raw.includes("rate limit") ||
    raw.includes("too many") ||
    raw.includes("over_email_send_rate_limit") ||
    raw.includes("email rate limit")
  ) {
    return "Trop de demandes envoyées pour cet email. Patientez quelques minutes avant de réessayer.";
  }

  if (
    raw.includes("redirect") &&
    (raw.includes("not allowed") || raw.includes("invalid") || raw.includes("allow list"))
  ) {
    return "L’URL de réinitialisation n’est pas autorisée par le serveur. Contactez votre administrateur (Supabase → Authentication → URL Configuration → Redirect URLs).";
  }

  if (
    raw.includes("smtp") ||
    raw.includes("email") && (raw.includes("not sent") || raw.includes("failed") || raw.includes("provider"))
  ) {
    return "Le service d’envoi d’email est indisponible. Réessayez plus tard ou contactez votre administrateur.";
  }

  if (raw.includes("invalid email") || raw.includes("invalid format")) {
    return "Cette adresse email n’est pas valide.";
  }

  if (
    raw.includes("network") ||
    raw.includes("fetch") ||
    raw.includes("failed to fetch") ||
    raw.includes("load failed")
  ) {
    return "Problème de connexion réseau. Vérifiez votre connexion et réessayez.";
  }

  if (raw.trim()) {
    return `L’envoi du lien a échoué : ${authError.message}`;
  }

  return "Une erreur s’est produite. Réessayez dans quelques instants.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleaned = email.trim().toLowerCase();
    if (!cleaned || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const supabase = getSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleaned, {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      logWarn("auth", "resetPasswordForEmail failed", {
        email: cleaned,
        redirectTo,
        status: (resetError as ResetAuthError).status ?? null,
        reason: resetError.message,
      });
      setError(mapResetError(resetError as ResetAuthError));
      return;
    }

    setSubmittedEmail(cleaned);
    setSuccess(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src={getLogoUrl()}
          alt={`${appConfig.name} logo`}
          width={72}
          height={72}
          className="rounded-2xl object-contain drop-shadow-lg"
          priority
          unoptimized
        />
        <p className="text-2xl font-bold tracking-wide text-white">{appConfig.name}</p>
        <p className="text-sm text-white/70">{appConfig.tagline}</p>
      </div>

      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {success ? (
          <div className="flex flex-col items-center text-center">
            <CheckCircle size={56} className="text-emerald-500" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Email envoyé !</h1>
            <p className="mt-2 text-sm text-gray-600">
              Un lien de réinitialisation a été envoyé à{" "}
              <span className="font-medium text-gray-900">{submittedEmail}</span>.
              <br />
              Vérifiez votre boîte de réception et vos spams.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              <ArrowLeft size={16} />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
            <p className="mb-6 text-sm text-gray-500">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser
              votre mot de passe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@rempres.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Envoi en cours…
                  </span>
                ) : (
                  "Envoyer le lien"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft size={14} />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </section>

      <p className="mt-6 text-xs text-white/40">v{appConfig.version}</p>
    </main>
  );
}
