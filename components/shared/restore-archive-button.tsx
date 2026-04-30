"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
export type ArchiveRestoreResult =
  | { success: true; data: null }
  | { success: false; error: string };

type RestoreArchiveButtonProps = {
  entityId: string;
  entityLabel: string;
  restoreAction: (id: string) => Promise<ArchiveRestoreResult>;
  redirectPath: string;
  listQueryString?: string;
};

function withListFlash(basePath: string, queryString: string, flash: { success?: string; error?: string }) {
  const p = new URLSearchParams(queryString);
  p.delete("success");
  p.delete("error");
  if (flash.success) p.set("success", flash.success);
  if (flash.error) p.set("error", flash.error);
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function RestoreArchiveButton({
  entityId,
  entityLabel,
  restoreAction,
  redirectPath,
  listQueryString = "",
}: RestoreArchiveButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function runRestore() {
    startTransition(async () => {
      const result = await restoreAction(entityId);
      setOpen(false);
      if (result.success) {
        router.push(
          withListFlash(redirectPath, listQueryString, { success: `${entityLabel} restauré avec succès.` }),
        );
      } else {
        router.push(withListFlash(redirectPath, listQueryString, { error: result.error }));
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15 disabled:opacity-50"
        aria-label={`Restaurer ${entityLabel}`}
      >
        <RotateCcw size={13} />
        Restaurer
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-darktext">Restaurer cet élément ?</h2>
            <p className="mt-2 text-sm text-darktext/80">
              « {entityLabel} » sera à nouveau visible dans la liste active.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={runRestore}
                disabled={pending}
              >
                {pending ? "Restauration…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
