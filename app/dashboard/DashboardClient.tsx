"use client";

import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type DashboardClientProps = {
  email: string | null;
};

export function DashboardClient({ email }: DashboardClientProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-darktext">Dashboard RemPres ERP</h1>
        <p className="mt-2 text-sm text-darktext/80">
          Connecté en tant que: {email ?? "Utilisateur"}
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white"
          type="button"
        >
          Se déconnecter
        </button>
      </div>
    </main>
  );
}
