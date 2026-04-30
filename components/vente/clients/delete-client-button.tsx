"use client";

import { useState } from "react";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";

type DeleteClientButtonProps = {
  label?: string;
};

export function DeleteClientButton({ label = "Supprimer" }: DeleteClientButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
  }

  function confirmDelete() {
    const form = document.getElementById("delete-client-form");
    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  }

  return (
    <>
      <button
        type="button"
        className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white"
        onClick={openModal}
      >
        {label}
      </button>

      <ConfirmDangerDialog
        open={isOpen}
        title="Confirmer la suppression"
        message="Cette action archive le client (soft delete). Voulez-vous continuer ?"
        onCancel={closeModal}
        onConfirm={confirmDelete}
      />
    </>
  );
}
