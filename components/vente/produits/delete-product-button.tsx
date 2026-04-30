"use client";

import { useState } from "react";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";

type DeleteProductButtonProps = {
  label?: string;
};

export function DeleteProductButton({ label = "Supprimer" }: DeleteProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  function confirmDelete() {
    const form = document.getElementById("delete-product-form");
    if (form instanceof HTMLFormElement) {
      form.requestSubmit();
    }
  }

  return (
    <>
      <button
        type="button"
        className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white"
        onClick={() => setIsOpen(true)}
      >
        {label}
      </button>

      <ConfirmDangerDialog
        open={isOpen}
        title="Confirmer la suppression"
        message="Cette action archive le produit (soft delete). Voulez-vous continuer ?"
        onCancel={() => setIsOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}

