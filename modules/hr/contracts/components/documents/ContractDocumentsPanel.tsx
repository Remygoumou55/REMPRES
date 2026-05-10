"use client";

import { useState, useTransition } from "react";
import { useTranslation } from "@/hooks/use-translation";
import type { ContractDocument } from "@/modules/hr/contracts/types";
import { addContractDocumentAction } from "@/modules/hr/contracts/server/actions/contract-actions";

export function ContractDocumentsPanel({
  contractId,
  documents,
  onDone,
}: {
  contractId: string;
  documents: ContractDocument[];
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [documentType, setDocumentType] = useState("signed_contract");
  const [fileName, setFileName] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <form
        className="grid gap-2 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await addContractDocumentAction({
              contractId,
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
            onDone?.();
          });
        }}
      >
        <input
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          placeholder={t("dashboard.rh.contracts.documents.type", "Type de document")}
        />
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          placeholder={t("dashboard.rh.contracts.documents.fileName", "Nom du fichier")}
        />
        <input
          value={storagePath}
          onChange={(e) => setStoragePath(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
          placeholder={t("dashboard.rh.contracts.documents.storagePath", "Chemin stockage")}
        />
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white md:col-span-3">
          {pending
            ? t("dashboard.rh.contracts.documents.pending", "Ajout...")
            : t("dashboard.rh.contracts.documents.submit", "Ajouter document")}
        </button>
      </form>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <ul className="space-y-1">
        {documents.map((doc) => (
          <li key={doc.id} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
            {doc.documentType} · {doc.fileName}
          </li>
        ))}
      </ul>
    </div>
  );
}
