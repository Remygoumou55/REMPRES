"use client";

import { memo, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import type { ConnectorInstance } from "@/lib/server/platform";
import { SERVICE_TYPE_LABELS } from "@/lib/constants/platform";
import {
  createConnectorAction,
  updateConnectorAction,
} from "@/app/(app)/admin/platform/connectors/actions";

type Props = {
  connector?: ConnectorInstance | null;
  onSuccess: () => void;
  onCancel: () => void;
};

function ConnectorFormInner({ connector, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(connector?.id);
  const [name, setName] = useState(connector?.name ?? "");
  const [description, setDescription] = useState(connector?.description ?? "");
  const [serviceType, setServiceType] = useState(connector?.service_type ?? "other");
  const [status, setStatus] = useState(connector?.status ?? "inactive");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom est obligatoire.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload = {
        name: name.trim(),
        service_type: serviceType,
        status,
        description: [description.trim(), notes.trim()].filter(Boolean).join("\n\n") || undefined,
      };
      const result = isEdit
        ? await updateConnectorAction(connector!.id, payload)
        : await createConnectorAction(payload);
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      onSuccess();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">
          Nom <span className="text-red-600">*</span>
        </label>
        <input
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Description</label>
        <textarea
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Service</label>
          <select
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Statut initial</label>
          <select
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "pending")}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="pending">pending</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Notes</label>
        <textarea
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        La configuration avancee (tokens API, cles secretes) est geree via des variables
        d&apos;environnement pour des raisons de securite.
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? "Mettre a jour" : "Creer le connecteur"}
        </button>
      </div>
    </form>
  );
}

export const ConnectorForm = memo(ConnectorFormInner);
