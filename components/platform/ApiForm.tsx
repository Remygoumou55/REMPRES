"use client";

import { memo, useState, useTransition } from "react";
import { Loader2, Save, Wifi } from "lucide-react";
import type { ApiEntry } from "@/lib/server/platform";
import { createApiAction, pingApiAction, updateApiAction } from "@/app/(app)/admin/platform/apis/actions";

type Props = {
  api?: ApiEntry | null;
  onSuccess: () => void;
  onCancel: () => void;
};

type PingResult = {
  reachable: boolean;
  latency_ms: number | null;
  status_code: number | null;
  error?: string;
} | null;

function ApiFormInner({ api, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(api?.id);
  const [name, setName] = useState(api?.name ?? "");
  const [description, setDescription] = useState(api?.description ?? "");
  const [apiType, setApiType] = useState(api?.api_type ?? "internal");
  const [status, setStatus] = useState(api?.status ?? "active");
  const [version, setVersion] = useState(api?.version ?? "v1");
  const [authType, setAuthType] = useState(api?.auth_type ?? "none");
  const [endpointUrl, setEndpointUrl] = useState(api?.endpoint_url ?? "");
  const [rateLimit, setRateLimit] = useState(String(api?.rate_limit_per_hour ?? 1000));
  const [notes, setNotes] = useState(api?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pingResult, setPingResult] = useState<PingResult>(null);
  const [isPending, startTransition] = useTransition();
  const [isPinging, startPingTransition] = useTransition();

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
        description: description.trim() || undefined,
        endpoint_url: endpointUrl.trim() || undefined,
        api_type: apiType,
        status,
        version: version.trim() || "v1",
        auth_type: authType,
        rate_limit_per_hour: Number(rateLimit || 1000),
        notes: notes.trim() || undefined,
      };
      const result = isEdit
        ? await updateApiAction(api!.id, payload)
        : await createApiAction(payload);

      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      onSuccess();
    });
  }

  function testConnection() {
    if (!endpointUrl.trim()) return;
    startPingTransition(async () => {
      const result = await pingApiAction(endpointUrl.trim());
      setPingResult(result);
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
          <label className="text-xs font-medium text-gray-600">Type</label>
          <select
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={apiType}
            onChange={(e) => setApiType(e.target.value as "internal" | "external" | "webhook")}
          >
            <option value="internal">internal</option>
            <option value="external">external</option>
            <option value="webhook">webhook</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Statut</label>
          <select
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive" | "deprecated")}
          >
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="deprecated">deprecated</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Version</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Authentification</label>
          <select
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={authType}
            onChange={(e) => setAuthType(e.target.value)}
          >
            <option value="none">none</option>
            <option value="api_key">api_key</option>
            <option value="bearer">bearer</option>
            <option value="oauth2">oauth2</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600">URL de l&apos;endpoint</label>
        <div className="flex gap-2">
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://api.example.com/v1/endpoint"
          />
          <button
            type="button"
            onClick={testConnection}
            disabled={!endpointUrl.trim() || isPinging}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPinging ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wifi className="h-3.5 w-3.5" />}
            Tester la connexion
          </button>
        </div>
        {pingResult ? (
          <p
            className={`text-xs ${pingResult.reachable ? "text-emerald-700" : "text-red-700"}`}
          >
            {pingResult.reachable
              ? `✓ Accessible - ${pingResult.latency_ms ?? "-"}ms`
              : `✗ Inaccessible${pingResult.error ? ` - ${pingResult.error}` : ""}`}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Rate limit par heure</label>
        <input
          type="number"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          value={rateLimit}
          onChange={(e) => setRateLimit(e.target.value)}
        />
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
          {isEdit ? "Mettre a jour" : "Creer l'API"}
        </button>
      </div>
    </form>
  );
}

export const ApiForm = memo(ApiFormInner);
