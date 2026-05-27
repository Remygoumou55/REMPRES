"use client";

import { memo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, History, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { WebhookForm } from "@/components/platform/WebhookForm";
import { WebhookToggle } from "@/components/platform/WebhookToggle";
import type { Webhook, WebhookDelivery } from "@/lib/server/webhooks";
import {
  DELIVERY_STATUS_COLORS,
  DELIVERY_STATUS_LABELS,
} from "@/lib/constants/webhooks";
import {
  deleteWebhookAction,
  listDeliveriesAction,
} from "@/app/(app)/admin/platform/webhooks/actions";

type Props = {
  webhooks: Webhook[];
  incomingCount: number;
  outgoingCount: number;
};

function formatEvents(events: string[]): string {
  if (events.length === 0) return "—";
  if (events.length <= 2) return events.join(", ");
  return `${events.slice(0, 2).join(", ")} +${events.length - 2}`;
}

function truncateUrl(url: string, max = 30): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max)}…`;
}

function WebhooksPageClientInner({ webhooks, incomingCount, outgoingCount }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);
  const [deliveriesTarget, setDeliveriesTarget] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeForm() {
    setOpenForm(false);
    setEditingWebhook(null);
  }

  function openCreate() {
    setEditingWebhook(null);
    setOpenForm(true);
  }

  function openEdit(webhook: Webhook) {
    setEditingWebhook(webhook);
    setOpenForm(true);
  }

  function openDeliveries(webhook: Webhook) {
    setDeliveriesTarget(webhook);
    setDeliveries([]);
    startTransition(async () => {
      const rows = await listDeliveriesAction(webhook.id, 10);
      setDeliveries(rows);
    });
  }

  function deleteCurrent() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteWebhookAction(deleteTarget.id);
      setMessage(
        result.success ? "Webhook supprimé." : result.error ?? "Suppression impossible.",
      );
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">
            {outgoingCount} sortants actifs
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-900">
            {incomingCount} entrants actifs
          </span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouveau webhook
        </button>
      </div>

      {message ? (
        <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700">{message}</p>
      ) : null}

      {webhooks.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Share2 className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun webhook configuré</p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            Créer le premier webhook
          </button>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                <th className="p-3">Nom</th>
                <th className="p-3">Direction</th>
                <th className="p-3">URL / Endpoint</th>
                <th className="p-3">Événements</th>
                <th className="p-3">Livraisons</th>
                <th className="p-3">Échecs</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-semibold text-darktext">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-gray-400">{item.description}</p>
                    ) : null}
                  </td>
                  <td className="p-3">
                    {item.direction === "outgoing" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        <ArrowUp className="h-3 w-3" />
                        Sortant
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-900">
                        <ArrowDown className="h-3 w-3" />
                        Entrant
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-600">
                    {item.direction === "outgoing"
                      ? item.target_url
                        ? truncateUrl(item.target_url)
                        : "—"
                      : "/api/webhooks/receive/***"}
                  </td>
                  <td className="p-3 text-xs text-gray-600">{formatEvents(item.events)}</td>
                  <td className="p-3 text-xs text-gray-600">
                    <p className="font-semibold tabular-nums">{item.delivery_count}</p>
                    <p>
                      {item.last_triggered_at
                        ? new Date(item.last_triggered_at).toLocaleString("fr-FR")
                        : "—"}
                    </p>
                  </td>
                  <td className="p-3">
                    <span
                      className={`tabular-nums text-xs font-semibold ${
                        item.failure_count > 0 ? "text-red-700" : "text-gray-500"
                      }`}
                    >
                      {item.failure_count}
                    </span>
                  </td>
                  <td className="p-3">
                    <WebhookToggle
                      webhookId={item.id}
                      isActive={item.is_active}
                      webhookName={item.name}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeliveries(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline"
                      >
                        <History className="h-3.5 w-3.5" />
                        Livraisons
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={openForm}
        onClose={closeForm}
        title={editingWebhook ? "Modifier webhook" : "Nouveau webhook"}
        subtitle="Intégrations entrantes et sortantes"
        size="2xl"
      >
        <WebhookForm
          webhook={editingWebhook}
          onSuccess={() => {
            setMessage(editingWebhook ? "Webhook mis à jour." : "Webhook créé.");
            closeForm();
          }}
          onCancel={closeForm}
        />
      </Modal>

      <Modal
        open={Boolean(deliveriesTarget)}
        onClose={() => setDeliveriesTarget(null)}
        title={`Livraisons — ${deliveriesTarget?.name ?? ""}`}
        subtitle="10 dernières livraisons"
        size="3xl"
      >
        {isPending && deliveries.length === 0 ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : deliveries.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune livraison enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-2">Date</th>
                  <th className="p-2">Événement</th>
                  <th className="p-2">Statut</th>
                  <th className="p-2">Code</th>
                  <th className="p-2">Durée</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => {
                  const color =
                    DELIVERY_STATUS_COLORS[d.status] ?? DELIVERY_STATUS_COLORS.pending;
                  return (
                    <tr key={d.id} className="border-b border-gray-100">
                      <td className="p-2">
                        {new Date(d.delivered_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="p-2">{d.event_type ?? "—"}</td>
                      <td className="p-2">
                        <span
                          className="rounded-full px-2 py-0.5 font-semibold"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {DELIVERY_STATUS_LABELS[d.status] ?? d.status}
                        </span>
                      </td>
                      <td className="p-2 tabular-nums">{d.response_code ?? "—"}</td>
                      <td className="p-2 tabular-nums">
                        {d.duration_ms != null ? `${d.duration_ms} ms` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDangerDialog
        open={Boolean(deleteTarget)}
        title="Supprimer webhook"
        message={`Supprimer le webhook « ${deleteTarget?.name ?? ""} » ?`}
        confirmLabel="Supprimer"
        loading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCurrent}
      />
    </div>
  );
}

export const WebhooksPageClient = memo(WebhooksPageClientInner);
