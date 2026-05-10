"use client";

import { useState, useTransition } from "react";
import type { EmployeeDocument } from "@/modules/hr/employees/types";
import { createEmployeeDocumentAction } from "@/modules/hr/employees/server/actions/employee-actions";

export function EmployeeDocumentsPanel({
  employeeId,
  documents,
  onCreated,
}: {
  employeeId: string;
  documents: EmployeeDocument[];
  onCreated?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [documentType, setDocumentType] = useState("other");
  const [fileName, setFileName] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <form
        className="grid gap-2 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await createEmployeeDocumentAction({
              employeeId,
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
            onCreated?.();
          });
        }}
      >
        <input value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm" placeholder="Type document" />
        <input value={fileName} onChange={(e) => setFileName(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm" placeholder="Nom fichier" />
        <input value={storagePath} onChange={(e) => setStoragePath(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm" placeholder="Chemin storage" />
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white md:col-span-3">
          {pending ? "Enregistrement..." : "Ajouter document"}
        </button>
      </form>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700">
            {doc.documentType} · {doc.fileName} · {doc.storagePath}
          </li>
        ))}
      </ul>
    </div>
  );
}

