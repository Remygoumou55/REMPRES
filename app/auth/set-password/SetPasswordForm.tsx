"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { appConfig, getLogoUrl } from "@/lib/config";
import { logError } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

interface PasswordRules {
  minLength: boolean;
  hasLetter:  boolean;
  hasNumber:  boolean;
  matches:    boolean;
}

function checkRules(password: string, confirm: string): PasswordRules {
  return {
    minLength: password.length >= 8,
    hasLetter:  /[A-Za-z]/.test(password),
    hasNumber:  /\d/.test(password),
    matches:    password.length > 0 && password === confirm,
  };
}

function isValidPassword(password: string, confirm: string): boolean {
  const r = checkRules(password, confirm);
  return r.minLength && r.hasLetter && r.hasNumber && r.matches;
}

function strengthScore(password: string): number {
  let score = 0;
  if (password.length >= 8)   score++;
  if (password.length >= 12)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password))    score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4);
}

const STRENGTH_CONFIG = [
  { label: "Très faible", color: "bg-red-400"    },
  { label: "Faible",      color: "bg-orange-400"  },
  { label: "Moyen",       color: "bg-yellow-400"  },
  { label: "Fort",        color: "bg-blue-500"    },
  { label: "Très fort",   color: "bg-green-500"   },
];

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function SetPasswordForm() {
  const router  = useRouter();
  const params  = useSearchParams();
  const mode    = params.get("mode"); // "recovery" | null (invite)

  const [password,  setPassword] = useState("");
  const [confirm,   setConfirm]  = useState("");
  const [showPwd,   setShowPwd]  = useState(false);
  const [loading,   setLoading]  = useState(false);
  const [success,   setSuccess]  = useState(false);
  const [error,     setError]    = useState<string | null>(null);

  // Vérifier que l'utilisateur a une session valide (arrivé via /auth/callback)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login?error=session_expired");
      }
    });
  }, [router]);

  const rules   = checkRules(password, confirm);
  const valid   = isValidPassword(password, confirm);
  const score   = strengthScore(password);
  const strengthInfo = STRENGTH_CONFIG[score] ?? STRENGTH_CONFIG[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!valid) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.");
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        const msg = updateError.message.toLowerCase();
        if (msg.includes("network") || msg.includes("fetch")) {
          setError("Problème de connexion. Vérifiez votre réseau et réessayez.");
        } else if (msg.includes("same password") || msg.includes("different")) {
          setError("Le nouveau mot de passe doit être différent de l'ancien.");
        } else if (msg.includes("weak")) {
          setError("Ce mot de passe est trop simple. Choisissez-en un plus sécurisé.");
        } else {
          setError("Impossible de définir le mot de passe. Veuillez réessayer.");
        }
        logError("SET_PASSWORD", updateError);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.replace("/dashboard"), 2500);
    } catch (err) {
      logError("SET_PASSWORD_UNEXPECTED", err);
      setError("Une erreur inattendue est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  const isInvite = mode !== "recovery";
  const title    = isInvite ? "Bienvenue sur RemPres !" : "Nouveau mot de passe";
  const subtitle = isInvite
    ? "Votre compte a été créé. Définissez un mot de passe pour accéder à votre espace."
    : "Choisissez un nouveau mot de passe sécurisé pour votre compte.";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-4 py-12">

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image
          src={getLogoUrl()}
          alt={appConfig.name}
          width={72}
          height={72}
          className="rounded-2xl object-contain drop-shadow-lg"
          priority
          unoptimized
        />
        <p className="text-2xl font-bold text-white">{appConfig.name}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

        {/* ── Succès ── */}
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle size={36} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Mot de passe enregistré !</h2>
            <p className="text-sm text-gray-500">
              Vous allez être redirigé vers votre espace de travail…
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              Redirection en cours
            </div>
          </div>

        ) : (
          <>
            <h1 className="mb-1 text-xl font-bold text-gray-900">{title}</h1>
            <p className="mb-6 text-sm text-gray-500">{subtitle}</p>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>

              {/* ── Mot de passe ── */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock size={15} className="text-gray-400" />
                  </div>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Minimum 8 caractères"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Barre de force */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            score >= i ? strengthInfo.color : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-right text-xs text-gray-400">
                      {strengthInfo.label}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Confirmation ── */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                    <Lock size={15} className="text-gray-400" />
                  </div>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition focus:ring-2 ${
                      confirm.length > 0 && !rules.matches
                        ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-300 focus:border-primary focus:ring-primary/20"
                    }`}
                    placeholder="Répétez votre mot de passe"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* ── Règles en temps réel ── */}
              <ul className="space-y-1.5 rounded-xl bg-gray-50 px-4 py-3">
                {(
                  [
                    ["8 caractères minimum",       rules.minLength],
                    ["Contient une lettre",         rules.hasLetter],
                    ["Contient un chiffre",         rules.hasNumber],
                    ["Les deux champs identiques",  rules.matches],
                  ] as [string, boolean][]
                ).map(([label, ok]) => (
                  <li
                    key={label}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                      ok ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      ok ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-400"
                    }`}>
                      {ok ? "✓" : "○"}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>

              {/* ── Erreur ── */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  {error}
                </div>
              )}

              {/* ── Bouton ── */}
              <button
                type="submit"
                disabled={loading || !valid}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-white transition ${
                  valid && !loading
                    ? "bg-primary hover:bg-primary/90"
                    : "cursor-not-allowed bg-gray-300"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Définir le mot de passe"
                )}
              </button>

            </form>
          </>
        )}
      </div>

      <p className="mt-6 text-xs text-white/30">
        v{appConfig.version} — {appConfig.name}
      </p>
    </main>
  );
}
