"use client";

import { memo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Copy, Loader2, Save } from "lucide-react";
import type { Webhook } from "@/lib/server/webhooks";
import { WEBHOOK_EVENT_OPTIONS } from "@/lib/constants/webhooks";
import {
  createWebhookAction,
  updateWebhookAction,
} from "@/app/(app)/admin/platform/webhooks/actions";

type Props = {
  webhook?: Webhook | null;
  onSuccess: (secretToken?: string) => void;
  onCancel: () => void;
};

function WebhookFormInner({ webhook, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(webhook?.id);
  const [name, setName] = useState(webhook?.name ?? "");
  const [description, setDescription] = useState(webhook?.description ?? "");
  const [direction, setDirection] = useState<"incoming" | "outgoing">(
    webhook?.direction ?? "outgoing",
  );
  const [targetUrl, setTargetUrl] = useState(webhook?.target_url ?? "");
  const [httpMethod, setHttpMethod] = useState(webhook?.http_method ?? "POST");
  const [events, setEvents] = useState<string[]>(webhook?.events ?? []);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleEvent(value: string) {
    setEvents((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    );
  }

  function validate(): string | null {
    if (!name.trim()) return "Le nom est obligatoire.";
    if (direction === "outgoing") {
      if (!targetUrl.trim()) return "L'URL cible est obligatoire pour un webhook sortant.";
      if (events.length === 0) return "Sélectionnez au moins un événement déclencheur.";
    }
    return null;
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    startTransition(async () => {
      if (isEdit) {
        const result = await updateWebhookAction(webhook!.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          target_url: direction === "outgoing" ? targetUrl.trim() : undefined,
          events: direction === "outgoing" ? events : [],
          http_method: httpMethod,
        });
        if (!result.success) {
          setError(result.error ?? "Enregistrement impossible.");
          return;
        }
        onSuccess();
        return;
      }

      const result = await createWebhookAction({
        name: name.trim(),
        description: description.trim() || undefined,
        direction,
        target_url: direction === "outgoing" ? targetUrl.trim() : undefined,
        events: direction === "outgoing" ? events : [],
        http_method: httpMethod,
      });

      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }

      if (result.secret_token) {
        setCreatedToken(result.secret_token);
        return;
      }
      onSuccess();
    });
  }

  function copyToken() {
    if (!createdToken) return;
    void navigator.clipboard.writeText(createdToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function confirmTokenSaved() {
    onSuccess(createdToken ?? undefined);
  }

  const incomingEndpoint =
    createdToken && typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/receive/${createdToken}`
      : createdToken
        ? `/api/webhooks/receive/${createdToken}`
        : null;

  if (createdToken) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Token secret — copiez-le maintenant</p>
          <p className="mt-1 text-xs">Ce token ne sera plus affiché après fermeture.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs">
          <span className="flex-1 break-all">{createdToken}</span>
          <button
            type="button"
            onClick={copyToken}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold hover:bg-white"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
        {direction === "incoming" && incomingEndpoint ? (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-600">Endpoint entrant</p>
            <p className="break-all rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-mono text-xs text-blue-900">
              {incomingEndpoint}
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={confirmTokenSaved}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
        >
          J&apos;ai copié le token — continuer
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-darktext">Informations</h3>
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
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-darktext">Direction</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDirection("outgoing")}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
              direction === "outgoing"
                ? "border-amber-300 bg-amber-50 text-amber-900"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Sortant
          </button>
          <button
            type="button"
            onClick={() => setDirection("incoming")}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
              direction === "incoming"
                ? "border-blue-300 bg-blue-50 text-blue-900"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Entrant
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {direction === "outgoing"
            ? "RemPres appelle une URL externe lors des événements sélectionnés."
            : "Un service externe appelle RemPres via un token sécurisé."}
        </p>
      </section>

      {direction === "outgoing" ? (
        <section className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              URL cible <span className="text-red-600">*</span>
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Méthode HTTP</label>
            <select
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
              value={httpMethod}
              onChange={(e) => setHttpMethod(e.target.value)}
            >
              <option value="POST">POST</option>
              <option value="GET">GET</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Événements déclencheurs</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {WEBHOOK_EVENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={events.includes(opt.value)}
                    onChange={() => toggleEvent(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          Un token secret sera généré automatiquement. Copiez-le à la création — il ne sera plus
          visible ensuite. Endpoint : <span className="font-mono">/api/webhooks/receive/[token]</span>
        </div>
      )}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      <div className="flex gap-2">
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
          {isEdit ? "Enregistrer" : "Créer le webhook"}
        </button>
      </div>
    </form>
  );
}

export const WebhookForm = memo(WebhookFormInner);
