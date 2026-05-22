"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CrmQuoteStatus } from "@/lib/vente/runtime/crm-state-machine";
import { updateCrmQuoteStatusAction } from "@/modules/crm/server/actions/crm-actions";

const NEXT_OPTIONS: Partial<Record<CrmQuoteStatus, CrmQuoteStatus[]>> = {
  draft: ["sent", "rejected"],
  sent: ["accepted", "rejected", "expired"],
  accepted: [],
};

type CrmQuoteStatusSelectProps = {
  quoteId: string;
  currentStatus: CrmQuoteStatus;
};

export function CrmQuoteStatusSelect({ quoteId, currentStatus }: CrmQuoteStatusSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const options = NEXT_OPTIONS[currentStatus] ?? [];

  if (!options.length) {
    return <span className="text-xs capitalize text-gray-500">{currentStatus}</span>;
  }

  return (
    <select
      className="rounded border border-gray-200 px-2 py-1 text-xs capitalize"
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as CrmQuoteStatus;
        if (!next) return;
        startTransition(async () => {
          await updateCrmQuoteStatusAction(quoteId, next);
          router.refresh();
        });
      }}
    >
      <option value="">{currentStatus}</option>
      {options.map((s) => (
        <option key={s} value={s}>
          → {s}
        </option>
      ))}
    </select>
  );
}
