"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  XCircle,
} from "lucide-react";

import { appConfig, getLogoUrl } from "@/lib/config";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Strength = {
  score: 0 | 1 | 2 | 3;
  label: "Trop court" | "Faible" | "Correct" | "Fort";
  color: string;
  width: string;
};

function evaluateStrength(value: string): Strength {
  if (value.length < 8) {
    return { score: 0, label: "Trop court", color: "bg-red-500", width: "w-1/4" };
  }
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  if (hasLetter && hasDigit && hasSymbol) {
    return { score: 3, label: "Fort", color: "bg-emerald-500", width: "w-full" };
  }
  if (hasLetter && hasDigit) {
    return { score: 2, label: "Correct", color: "bg-emerald-500", width: "w-3/4" };
  }
  return { score: 1, label: "Faible", color: "bg-amber-500", width: "w-1/2" };
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // When the user clicks the magic link, Supabase puts the session in the URL
  // hash and the client picks it up automatically. We check that a session
  // exists before allowing the user to change their password.
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      const supabase = getSupabaseBrowserClient();
      // Give the auth helper a tick to consume the URL hash.
      await new Promise((resolve) => setTimeout(resolve, 250));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setLinkInvalid(true);
      }
      setCheckingSession(false);
    }
    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const strength = useMemo(() => evaluateStrength(password), [password]);
  const mismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      const msg = updateError.message.toLowerCase();
      if (msg.includes("weak") || msg.includes("at least")) {
        setError("Le mot de passe est trop faible. Choisissez un mot de passe plus robuste.");
        return;
      }
      if (msg.includes("session") || msg.includes("expired") || msg.includes("invalid")) {
        setLinkInvalid(true);
        return;
      }
      setError("Impossible de mettre à jour le mot de passe. Réessayez.");
      return;
    }

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
            <h1 className="mt-4 text-xl font-bold text-gray-900">Mot de passe mis à jour !</h1>
            <p className="mt-2 text-sm text-gray-600">
              Votre mot de passe a été changé avec succès.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              Se connecter maintenant
            </Link>
          </div>
        ) : linkInvalid ? (
          <div className="flex flex-col items-center text-center">
            <XCircle size={56} className="text-red-500" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-bold text-gray-900">Lien invalide ou expiré</h1>
            <p className="mt-2 text-sm text-gray-600">
              Le lien de réinitialisation n&apos;est plus valide. Demandez-en un nouveau pour
              continuer.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              Demander un nouveau lien
            </Link>
            <Link
              href="/login"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft size={14} />
              Retour à la connexion
            </Link>
          </div>
        ) : checkingSession ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Vérification du lien…
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
            <p className="mb-6 text-sm text-gray-500">
              Choisissez un nouveau mot de passe sécurisé pour votre compte.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {password.length > 0 ? (
                  <div className="mt-2">
                    <div
                      className="h-1.5 w-full rounded-full bg-gray-200"
                      aria-hidden="true"
                    >
                      <div
                        className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`}
                      />
                    </div>
                    <p
                      className={`mt-1 text-xs ${
                        strength.score === 0
                          ? "text-red-600"
                          : strength.score === 1
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {strength.label}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>
                {mismatch ? (
                  <p className="mt-1 text-xs text-red-600">
                    Les mots de passe ne correspondent pas.
                  </p>
                ) : null}
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || mismatch || password.length < 8}
                className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Mise à jour…
                  </span>
                ) : (
                  "Réinitialiser le mot de passe"
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
