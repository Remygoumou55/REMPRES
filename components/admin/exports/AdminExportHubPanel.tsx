import Link from "next/link";
import { ArrowLeft, FileDown } from "lucide-react";
import type { ReactNode } from "react";

type AdminExportHubPanelProps = {
  title: string;
  description: string;
  count: number;
  countLabel: string;
  periodHint?: string;
  exportAction: ReactNode;
  filters?: ReactNode;
};

export function AdminExportHubPanel({
  title,
  description,
  count,
  countLabel,
  periodHint,
  exportAction,
  filters,
}: AdminExportHubPanelProps) {
  return (
    <div className="page-wrapper">
      <Link
        href="/admin/exports"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        Retour aux exports
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileDown className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
          </div>
          <div className="shrink-0">{exportAction}</div>
        </div>

        {filters ? <div className="mt-5 border-t border-gray-100 pt-5">{filters}</div> : null}

        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          <p className="text-sm text-gray-700">
            <span className="text-2xl font-semibold tabular-nums text-gray-900">{count}</span>{" "}
            {countLabel}
            {periodHint ? (
              <span className="mt-1 block text-xs text-gray-500">{periodHint}</span>
            ) : null}
          </p>
          {count === 0 ? (
            <p className="mt-2 text-xs text-amber-700">
              Aucune donnée à exporter pour le moment. Ajustez la période ou revenez plus tard.
            </p>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              Choisissez Excel ou PDF — le fichier inclura l&apos;ensemble des lignes visibles ci-dessus.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
