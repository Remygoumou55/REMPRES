"use client";

import { Trash2 } from "lucide-react";

type BulkDeleteActionBarProps = {
  selectedCount: number;
  itemLabel: string;
  pending?: boolean;
  onDelete: () => void;
  onClear: () => void;
};

export function BulkDeleteActionBar({
  selectedCount,
  itemLabel,
  pending = false,
  onDelete,
  onClear,
}: BulkDeleteActionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5">
      <p className="text-xs font-semibold text-danger">
        {selectedCount} {itemLabel}
        {selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-darktext"
          disabled={pending}
        >
          Annuler la sélection
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Trash2 size={13} />
          {pending ? "Suppression…" : "Supprimer la sélection"}
        </button>
      </div>
    </div>
  );
}
