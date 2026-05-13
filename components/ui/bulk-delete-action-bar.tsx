"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div
      role="toolbar"
      aria-label="Actions sur la sélection"
      aria-busy={pending}
      className="flex flex-col gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2"
    >
      <p className="text-xs font-semibold text-danger sm:min-w-0 sm:flex-1">
        {selectedCount} {itemLabel}
        {selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
      </p>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          onClick={onClear}
          variant="outline"
          size="sm"
          disabled={pending}
          className="min-h-10 w-full justify-center sm:w-auto"
        >
          Annuler la sélection
        </Button>
        <Button
          type="button"
          onClick={onDelete}
          variant="danger"
          size="sm"
          loading={pending}
          loadingText="Suppression..."
          className="min-h-10 w-full justify-center sm:w-auto"
        >
          <Trash2 size={13} />
          Supprimer la sélection
        </Button>
      </div>
    </div>
  );
}
