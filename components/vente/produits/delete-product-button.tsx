"use client";

import { useState } from "react";

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

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-darktext">Confirmer la suppression</h2>
            <p className="mt-2 text-sm text-darktext/80">
              Cette action archive le produit (soft delete). Voulez-vous continuer ?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white"
                onClick={confirmDelete}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

