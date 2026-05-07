"use client";

import { useState } from "react";

export function ApprovalDecisionModal({
  onSubmit,
  submitLabel,
}: {
  onSubmit: (reason: string) => void;
  submitLabel: string;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Raison (optionnel)"
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
      />
      <button
        type="button"
        onClick={() => onSubmit(reason)}
        className="rounded-lg bg-gray-900 px-2 py-1 text-xs text-white"
      >
        {submitLabel}
      </button>
    </div>
  );
}
