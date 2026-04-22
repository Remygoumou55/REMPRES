import Image from "next/image";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { LoginForm } from "./LoginForm";
import { appConfig, getLogoUrl } from "@/lib/config";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-primary px-4 py-12">
      {/* Logo + nom au-dessus du formulaire */}
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
        <p className="text-2xl font-bold text-white tracking-wide">{appConfig.name}</p>
        <p className="text-sm text-white/70">{appConfig.tagline}</p>
      </div>

      <LoginForm />

      <p className="mt-6 text-xs text-white/40">
        v{appConfig.version} &mdash; {appConfig.address}
      </p>
    </main>
  );
}
