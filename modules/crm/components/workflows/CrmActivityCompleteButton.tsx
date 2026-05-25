"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeCrmActivityAction } from "@/modules/crm/server/actions/crm-actions";

export function CrmActivityCompleteButton({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await completeCrmActivityAction(activityId);
          router.refresh();
        })
      }
      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
    >
      {pending ? "…" : "Terminer"}
    </button>
  );
}
