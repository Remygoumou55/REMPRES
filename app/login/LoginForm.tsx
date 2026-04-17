"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-lg bg-white p-6 shadow-sm"
    >
      <h1 className="mb-6 text-2xl font-semibold text-darktext">Connexion</h1>

      <label htmlFor="email" className="mb-2 block text-sm font-medium text-darktext">
        Adresse email
      </label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 outline-none ring-primary/20 focus:border-primary focus:ring-4"
        required
      />

      <label htmlFor="password" className="mb-2 block text-sm font-medium text-darktext">
        Mot de passe
      </label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 outline-none ring-primary/20 focus:border-primary focus:ring-4"
        required
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
