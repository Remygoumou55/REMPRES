import { redirect } from "next/navigation";
import { Award, Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertFormationRead } from "@/lib/server/formation-access";
import { listCertificates, listTraineesForSelect, listTrainingsForSelect } from "@/lib/server/formation";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { issueCertificateAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams?: { success?: string; error?: string } };

export default async function CertificatsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationRead(user.id);

  const [{ data, total }, trainings, trainees] = await Promise.all([
    listCertificates(),
    listTrainingsForSelect(),
    listTraineesForSelect(),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader title="Certificats" subtitle={`${total} certificat(s) émis`} />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <details className="card mb-6 p-4">
        <summary className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Plus className="h-4 w-4" />
          Émettre un certificat
        </summary>
        <form action={issueCertificateAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Formation</label>
            <select name="training_id" required className="input w-full">
              <option value="">—</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Apprenant</label>
            <select name="trainee_id" required className="input w-full">
              <option value="">—</option>
              {trainees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Note /20</label>
            <input name="score" type="number" step="0.01" className="input w-full" />
          </div>
          <div>
            <label className="label">Mention</label>
            <input name="grade" className="input w-full" />
          </div>
          <div>
            <label className="label">Valide jusqu&apos;au</label>
            <input name="valid_until" type="date" className="input w-full" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary text-sm">
              Émettre
            </button>
          </div>
        </form>
      </details>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Award className="h-12 w-12 text-gray-300" />
          <p>Aucun certificat</p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">N° certificat</th>
                <th className="p-3">Apprenant</th>
                <th className="p-3">Formation</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="p-3 font-mono text-xs">{c.certificate_number}</td>
                  <td className="p-3">
                    {c.trainee ? `${c.trainee.first_name} ${c.trainee.last_name}` : "—"}
                  </td>
                  <td className="p-3">{c.training?.title ?? "—"}</td>
                  <td className="p-3">{new Date(c.issued_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
