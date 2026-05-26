import { redirect } from "next/navigation";

import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { ProfilClient } from "./ProfilClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Mon profil",
};

type SearchParams = { tab?: string };

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role_key: string | null;
};

function normalizeTab(raw?: string): "photo" | "infos" | "securite" {
  switch ((raw ?? "").toLowerCase()) {
    case "photo":
      return "photo";
    case "securite":
    case "security":
      return "securite";
    default:
      return "infos";
  }
}

function joinName(first: string | null, last: string | null): string {
  return [first, last]
    .map((value) => (value ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export default async function ProfilPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, avatar_url, role_key")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const fullName = joinName(data?.first_name ?? null, data?.last_name ?? null);
  const email = data?.email ?? user.email ?? null;
  const avatarUrl = data?.avatar_url ?? null;
  const role = data?.role_key ?? null;

  const initialTab = normalizeTab(searchParams?.tab);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Mon profil"
        subtitle="Gérez votre photo, vos informations et votre mot de passe."
      />
      <ProfilClient
        initialTab={initialTab}
        fullName={fullName}
        email={email}
        avatarUrl={avatarUrl}
        role={role}
      />
    </div>
  );
}
