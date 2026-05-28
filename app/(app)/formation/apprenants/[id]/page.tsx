import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, BookOpen, Download, Mail, Phone } from "lucide-react";
import { getApprenantById } from "@/lib/server/formation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
};

export default async function ApprenantDetailPage({ params }: Props) {
  const apprenant = await getApprenantById(params.id);
  if (!apprenant) notFound();

  const initials = apprenant.full_name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        href="/formation/apprenants"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 group hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux apprenants
      </Link>

      <div className="mb-5 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-medium text-blue-700">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="mb-1 text-lg font-medium text-gray-900">{apprenant.full_name}</h1>
          <p className="mb-2 text-xs text-gray-500">
            Inscrit le{" "}
            {new Date(apprenant.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            {apprenant.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {apprenant.email}
              </span>
            )}
            {apprenant.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {apprenant.phone}
              </span>
            )}
          </div>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            apprenant.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {apprenant.status === "active" ? "Actif" : "Inactif"}
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-2xl font-medium text-gray-900">{apprenant.total_formations}</p>
          <p className="mt-1 text-xs text-gray-500">Formations suivies</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-2xl font-medium text-gray-900">{apprenant.certified_formations}</p>
          <p className="mt-1 text-xs text-gray-500">Certificats obtenus</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-2xl font-medium text-gray-900">{apprenant.in_progress_formations}</p>
          <p className="mt-1 text-xs text-gray-500">En cours</p>
        </div>
      </div>

      {apprenant.enrollments.length > 0 && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <BookOpen className="h-4 w-4" />
            Historique des formations
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Formation</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Date</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Progression</th>
                <th className="pb-2 text-left text-xs font-medium text-gray-400">Statut</th>
              </tr>
            </thead>
            <tbody>
              {apprenant.enrollments.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 font-medium text-gray-900">{e.training_name}</td>
                  <td className="py-2.5 text-xs text-gray-500">{new Date(e.enrolled_at).toLocaleDateString("fr-FR")}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${Math.min(100, e.progress_pct)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{e.progress_pct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        e.status === "certified"
                          ? "bg-blue-50 text-blue-700"
                          : e.status === "completed"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {e.status === "certified" ? "Certifié" : e.status === "completed" ? "Terminé" : "En cours"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {apprenant.certificates.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <Award className="h-4 w-4" />
            Certificats obtenus
          </h2>
          <div className="flex flex-col gap-2">
            {apprenant.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{cert.training_name}</p>
                  <p className="text-xs text-gray-400">
                    Délivré le {new Date(cert.issued_at).toLocaleDateString("fr-FR")} · N° {cert.certificate_number}
                  </p>
                </div>
                <span className="flex cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50">
                  <Download className="h-3 w-3" />
                  PDF
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {apprenant.enrollments.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Aucune formation suivie</p>
          <p className="mt-1 text-xs text-gray-400">
            Cet apprenant n&apos;est inscrit à aucune formation pour le moment.
          </p>
        </div>
      )}
    </div>
  );
}
