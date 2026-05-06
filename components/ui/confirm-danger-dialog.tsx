"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loadingLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** danger = suppression / archive irréversible ; primary = restauration, validation métier */
  tone?: "danger" | "primary";
  /** Sous-titre sous le titre (défaut selon `tone`) */
  subtitle?: string;
  /** Remplace l’icône par défaut (triangle / check) */
  icon?: ReactNode;
};

/**
 * Modale de confirmation — même structure pour toutes les actions sensibles (liste / détail / archives).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loadingLabel = "Traitement…",
  loading = false,
  onCancel,
  onConfirm,
  tone = "danger",
  subtitle,
  icon,
}: ConfirmDialogProps) {
  const resolvedSubtitle =
    subtitle ?? (tone === "danger" ? "Action irréversible" : "Confirmation requise");

  const defaultIcon =
    tone === "danger" ? (
      <AlertTriangle size={18} className="text-danger" />
    ) : (
      <CheckCircle2 size={18} className="text-primary" />
    );

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!loading) onCancel();
      }}
      title={title}
      subtitle={resolvedSubtitle}
      icon={icon ?? defaultIcon}
      size="md"
    >
      <p className="text-sm text-darktext/80">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
          loadingText={loadingLabel}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

type ConfirmDangerOnlyProps = Omit<ConfirmDialogProps, "tone" | "subtitle" | "icon"> & {
  subtitle?: string;
  icon?: ReactNode;
};

/** Suppression, archivage, purge — bouton de confirmation rouge. */
export function ConfirmDangerDialog(props: ConfirmDangerOnlyProps) {
  return <ConfirmDialog tone="danger" {...props} />;
}

type ConfirmActionOnlyProps = Omit<ConfirmDialogProps, "tone">;

/** Restauration, enregistrement de paiement, etc. — bouton de confirmation primaire. */
export function ConfirmActionDialog(props: ConfirmActionOnlyProps) {
  return <ConfirmDialog tone="primary" {...props} />;
}
