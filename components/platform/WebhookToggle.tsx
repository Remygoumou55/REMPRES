"use client";

import { memo, useEffect, useState, useTransition } from "react";
import { toggleWebhookAction } from "@/app/(app)/admin/platform/webhooks/actions";

type Props = {
  webhookId: string;
  isActive: boolean;
  webhookName: string;
};

function WebhookToggleInner({ webhookId, isActive, webhookName }: Props) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActive(isActive);
  }, [isActive]);

  function onToggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result = await toggleWebhookAction(webhookId, next);
      if (!result.success) setActive(!next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${active ? "Désactiver" : "Activer"} le webhook ${webhookName}`}
      onClick={onToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold transition ${
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-gray-200 bg-gray-50 text-gray-500"
      } ${isPending ? "opacity-60" : ""}`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-600" : "bg-gray-400"}`}
      />
      {active ? "ON" : "OFF"}
    </button>
  );
}

export const WebhookToggle = memo(WebhookToggleInner);
