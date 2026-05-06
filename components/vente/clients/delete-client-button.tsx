"use client";

import { useState, useTransition } from "react";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/ToastProvider";
import { resolveUnknownErrorMessage } from "@/lib/messages";

type DeleteClientButtonProps = {
  /** Server action d’archivage (soft delete) */
  deleteAction: () => Promise<void>;
  label?: string;
};

export function DeleteClientButton({ deleteAction, label = "Supprimer" }: DeleteClientButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showError } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      try {
        setIsOpen(false);
        await deleteAction();
      } catch (error) {
        showError(resolveUnknownErrorMessage(error));
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        onClick={() => setIsOpen(true)}
        disabled={pending}
      >
        {label}
      </Button>

      <ConfirmDangerDialog
        open={isOpen}
        title="Confirmer la suppression"
        message="Cette action archive le client (soft delete). Voulez-vous continuer ?"
        confirmLabel="Confirmer"
        loadingLabel="Suppression…"
        loading={pending}
        onCancel={() => !pending && setIsOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}
