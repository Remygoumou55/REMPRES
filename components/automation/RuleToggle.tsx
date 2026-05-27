"use client";

import { memo, useEffect, useState, useTransition } from "react";
import { toggleRuleAction } from "@/app/(app)/admin/automation/rules/actions";

type Props = {
  ruleId: string;
  isActive: boolean;
  ruleName: string;
};

function RuleToggleInner({ ruleId, isActive, ruleName }: Props) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setActive(isActive);
  }, [isActive]);

  function onToggle() {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      const result = await toggleRuleAction(ruleId, next);
      if (!result.success) {
        setActive(!next);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`${active ? "Désactiver" : "Activer"} la règle ${ruleName}`}
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

export const RuleToggle = memo(RuleToggleInner);
