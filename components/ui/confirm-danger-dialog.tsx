"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

type ConfirmDangerDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDangerDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  loadingLabel = "Traitement…",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDangerDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      subtitle="Action irréversible"
      icon={<AlertTriangle size={18} />}
      size="md"
    >
      <p className="text-sm text-darktext/80">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="button"
          className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? loadingLabel : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
