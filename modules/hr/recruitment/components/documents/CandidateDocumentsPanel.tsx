"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import type { RecruitmentDocument } from "@/modules/hr/recruitment/types";
import { addCandidateDocumentAction } from "@/modules/hr/recruitment/server/actions/recruitment-actions";

export function CandidateDocumentsPanel({
  candidateId,
  documents,
}: {
  candidateId: string;
  documents: RecruitmentDocument[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [documentType, setDocumentType] = useState("cv");
  const [fileName, setFileName] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  return (
    <div className="space-y-2">
      <form
        className="grid gap-2 md:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await addCandidateDocumentAction({
              candidateId,
              documentType,
              fileName,
              storagePath,
            });
            if (!result.success) {
              setError(result.error);
              return;
            }
            setFileName("");
            setStoragePath("");
            refresh();
          });
        }}
      >
        <input
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          placeholder={t("dashboard.rh.recruitment.docs.type", "Type")}
        />
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          placeholder={t("dashboard.rh.recruitment.docs.fileName", "Fichier")}
        />
        <input
          value={storagePath}
          onChange={(e) => setStoragePath(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          placeholder={t("dashboard.rh.recruitment.docs.path", "Chemin stockage")}
        />
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white md:col-span-3">
          {t("dashboard.rh.recruitment.docs.submit", "Ajouter document")}
        </button>
      </form>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <ul className="space-y-1 text-[11px]">
        {documents.map((d) => (
          <li key={d.id} className="rounded border border-gray-100 px-2 py-1">
            {d.documentType} · {d.fileName}
          </li>
        ))}
      </ul>
    </div>
  );
}
