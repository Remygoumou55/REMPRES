"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { ConfirmActionDialog } from "@/components/ui/confirm-danger-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/ToastProvider";
import { resolveUnknownErrorMessage } from "@/lib/messages";

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
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showError } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function runRestore() {
    startTransition(async () => {
      try {
        const result = await restoreAction(entityId);
        setOpen(false);
        if (result.success) {
          pushThenRefresh(
            withListFlash(redirectPath, listQueryString, { success: `${entityLabel} restauré avec succès.` }),
          );
        } else {
          pushThenRefresh(withListFlash(redirectPath, listQueryString, { error: result.error }));
        }
      } catch (error) {
        const message = resolveUnknownErrorMessage(error);
        showError(message);
        pushThenRefresh(withListFlash(redirectPath, listQueryString, { error: message }));
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        disabled={pending}
        onClick={() => setOpen(true)}
        variant="ghost"
        size="sm"
        className="bg-primary/10 text-primary hover:bg-primary/15"
        aria-label={`Restaurer ${entityLabel}`}
      >
        <RotateCcw size={13} />
        Restaurer
      </Button>

      <ConfirmActionDialog
        open={open}
        title="Restaurer cet élément ?"
        message={`« ${entityLabel} » sera à nouveau visible dans la liste active.`}
        confirmLabel="Confirmer"
        loadingLabel="Restauration…"
        loading={pending}
        subtitle="Restauration"
        icon={<RotateCcw size={18} className="text-primary" />}
        onCancel={() => !pending && setOpen(false)}
        onConfirm={runRestore}
      />
    </>
  );
}
