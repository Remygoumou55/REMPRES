"use client";

import { memo, useState, useTransition } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import {
  permanentDeleteAction,
  restoreRecordAction,
} from "@/app/(app)/admin/suppressions/actions";

export type SuppressionRecord = {
  id: string;
  label: string;
  deleted_at: string;
  table: string;
  module: string;
  extra?: string;
};

type Props = {
  records: SuppressionRecord[];
  sectionTitle: string;
  module: string;
  table: string;
};

function formatDeletedAt(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SuppressionsSectionInner({
  records,
  sectionTitle,
  table,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  if (records.length === 0) return null;

  function clearMessage(id: string) {
    setMessages((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function handleRestore(id: string) {
    clearMessage(id);
    startTransition(async () => {
      const result = await restoreRecordAction(table, id);
      if (!result.success) {
        setMessages((m) => ({
          ...m,
          [id]: result.error ?? "Erreur inconnue",
        }));
      }
    });
  }

  function handlePermanentDelete(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    clearMessage(id);
    startTransition(async () => {
      const result = await permanentDeleteAction(table, id);
      if (!result.success) {
        setMessages((m) => ({
          ...m,
          [id]: result.error ?? "Erreur inconnue",
        }));
      }
    });
  }

  return (
    <section className="mb-6">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
        {sectionTitle}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {records.length}
        </span>
      </h3>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                Nom
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                Supprimé le
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={`${record.table}:${record.id}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{record.label}</div>
                  {record.extra ? (
                    <div className="mt-0.5 text-xs text-gray-500">
                      {record.extra}
                    </div>
                  ) : null}
                  {messages[record.id] ? (
                    <div className="mt-1 text-xs text-red-600">
                      {messages[record.id]}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {formatDeletedAt(record.deleted_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleRestore(record.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      Restaurer
                    </button>
                    {confirmDelete === record.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(record.id)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          <AlertTriangle size={12} />
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          disabled={isPending}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePermanentDelete(record.id)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export const SuppressionsSection = memo(SuppressionsSectionInner);
