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
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5">
      <p className="text-xs font-semibold text-danger">
        {selectedCount} {itemLabel}
        {selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onClear}
          variant="outline"
          size="sm"
          disabled={pending}
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
        >
          <Trash2 size={13} />
          Supprimer la sélection
        </Button>
      </div>
    </div>
  );
}
