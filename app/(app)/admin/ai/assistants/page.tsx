import { redirect } from "next/navigation";
import { TableShell } from "@/components/ui/table-shell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { listAiAssistantEventsRecent } from "@/modules/ai/server/repositories/ai-assistant-repository";

export default async function AdminAiAssistantsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  const perms = await getModulePermissions(user.id, ["ai"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const rows = await listAiAssistantEventsRecent(supabase, 100);

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Assistant opérationnel</h1>
        <p className="mt-1 text-sm text-gray-600">
          Journal append-only par session — traçabilité et garde-fous (<span className="font-medium">safety_flags</span>
          ). Brancher un LLM en aval sans modifier les contrats RLS.
        </p>
      </section>

      <TableShell>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            <tr>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Créé</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="max-w-[180px] truncate px-4 py-2 font-mono text-xs">{r.session_key}</td>
                <td className="px-4 py-2">{r.event_kind}</td>
                <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  Aucun événement assistant.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableShell>
    </>
  );
}
