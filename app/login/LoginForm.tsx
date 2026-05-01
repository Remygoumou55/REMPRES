"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { logError, logInfo, logWarn } from "@/lib/logger";
import { getDestinationForRole } from "@/lib/roleRedirects";

// ---------------------------------------------------------------------------
// Mapping d'erreurs Supabase → messages français
// ---------------------------------------------------------------------------

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid credentials"))
    return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Veuillez confirmer votre adresse email avant de vous connecter.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Trop de tentatives de connexion. Veuillez patienter quelques minutes.";
  if (m.includes("user not found"))
    return "Aucun compte associé à cet email.";
  if (m.includes("password"))
    return "Mot de passe invalide.";
  return "Une erreur est survenue. Veuillez réessayer.";
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function LoginForm() {
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      logWarn("auth", "login failed", { email, reason: signInError.message });
      const msg = signInError.message.toLowerCase();
      if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
        setError("Problème de connexion. Vérifiez votre réseau et réessayez.");
      } else {
        setError(mapAuthError(signInError.message));
      }
      setLoading(false);
      return;
    }

    // Récupérer le profil — obligatoire pour déterminer le rôle
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role_key")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        // Le profil n'existe pas → compte mal configuré
        logError("auth", "login profile missing", {
          userId: data.user.id,
          error: profileError ?? new Error("profile is null"),
        });
        router.replace("/error-profile");
        return;
      }

      logInfo("auth", "login success", { userId: data.user.id, role: profile.role_key });
      router.replace(getDestinationForRole(profile.role_key));
      router.refresh();
    } catch (err) {
      logError("auth", "login profile fetch failed", { userId: data.user.id, error: err });
      setError("Une erreur est survenue lors de la connexion. Veuillez réessayer.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
    >
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Connexion</h1>
      <p className="mb-6 text-sm text-gray-500">
        Accédez à votre espace de travail.
      </p>

      {/* Email */}
      <div className="mb-4">
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
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="vous@rempres.com"
            autoComplete="email"
            required
          />
        </div>
      </div>

      {/* Mot de passe */}
      <div className="mb-2">
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
          Mot de passe
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
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Votre mot de passe"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Lien mot de passe oublié */}
      <div className="mb-5 text-right">
        <Link
          href="/forgot-password"
          className="text-xs font-medium text-primary hover:underline"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Connexion…
          </span>
        ) : (
          "Se connecter"
        )}
      </button>
    </form>
  );
}
