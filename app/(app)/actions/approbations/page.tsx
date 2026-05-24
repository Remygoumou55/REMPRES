import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertSuperAdmin } from "@/lib/server/permissions";
import { listApprovals } from "@/lib/server/approvals";
import { ApprovalsBoardClient } from "./ApprovalsBoardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: {
    status?: string;
    id?: string;
  };
};

const TABS = [
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvées" },
  { key: "rejected", label: "Rejetées" },
  { key: "all", label: "Toutes" },
] as const;

export default async function ApprobationsPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const allowed = await assertSuperAdmin(user.id);
    if (!allowed) {
      redirect("/access-denied");
    }
  } catch {
    redirect("/access-denied");
  }

  const status = searchParams?.status ?? "pending";
  const approvals = await listApprovals(status);

  return (
    <div className="page-wrapper space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approbations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Validation des actions sensibles soumises par les responsables département.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = status === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/actions/approbations?status=${tab.key}`}
              className={
                active
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                  : "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-secondary"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <ApprovalsBoardClient approvals={approvals} />
    </div>
  );
}
