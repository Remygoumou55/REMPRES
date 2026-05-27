"use client";

import { memo, useState, useTransition } from "react";
import { Pencil, Plus, Power, PowerOff, Trash2, Plug } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { ConnectorForm } from "@/components/platform/ConnectorForm";
import type { ConnectorInstance } from "@/lib/server/platform";
import {
  CONNECTOR_STATUS_COLORS,
  CONNECTOR_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants/platform";
import {
  deleteConnectorAction,
  toggleConnectorAction,
} from "@/app/(app)/admin/platform/connectors/actions";

type Props = {
  connectors: ConnectorInstance[];
};

const SERVICE_ICONS: Record<string, string> = {
  whatsapp: "💬",
  email: "📧",
  sms: "📱",
  google: "🔍",
  slack: "💼",
  resend: "📨",
  orange_money: "🟠",
  mtn_money: "💛",
  microsoft: "🪟",
  other: "🔌",
};

function relativeHours(value: string | null): string {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "—";
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "il y a <1h";
  return `il y a ${hours}h`;
}

function ConnectorsPageClientInner({ connectors }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editingConnector, setEditingConnector] = useState<ConnectorInstance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConnectorInstance | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const connectedCount = connectors.filter((item) => item.status === "active").length;
  const inactiveCount = connectors.filter((item) => item.status === "inactive").length;
  const errorCount = connectors.filter((item) => item.status === "error").length;

  function closeForm() {
    setOpenForm(false);
    setEditingConnector(null);
  }

  function toggle(item: ConnectorInstance) {
    const next = item.status === "active" ? "inactive" : "active";
    startTransition(async () => {
      const result = await toggleConnectorAction(item.id, next);
      setMessage(result.success ? "Statut connecteur mis a jour." : result.error ?? "Action impossible.");
    });
  }

  function deleteCurrent() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteConnectorAction(deleteTarget.id);
      setMessage(result.success ? "Connecteur supprime." : result.error ?? "Suppression impossible.");
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
            {connectedCount} connectes
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
            {inactiveCount} inactifs
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
            {errorCount} en erreur
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingConnector(null);
            setOpenForm(true);
          }}
          className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouveau connecteur
        </button>
      </div>

      {message ? <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700">{message}</p> : null}

      {connectors.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Plug className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun connecteur configure</p>
          <button
            type="button"
            onClick={() => setOpenForm(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            Ajouter un connecteur
          </button>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connectors.map((item) => {
            const color = CONNECTOR_STATUS_COLORS[item.status];
            const icon = SERVICE_ICONS[item.service_type] ?? SERVICE_ICONS.other;
            const serviceLabel = SERVICE_TYPE_LABELS[item.service_type] ?? SERVICE_TYPE_LABELS.other;
            return (
              <article key={item.id} className="card space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                    {icon}
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: color.bg, color: color.text }}
                  >
                    {CONNECTOR_STATUS_LABELS[item.status]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-darktext">{serviceLabel}</p>
                  <p className="text-sm text-gray-500">{item.name}</p>
                </div>
                <p className="text-xs text-gray-500">Last sync: {relativeHours(item.last_sync_at)}</p>
                {item.status === "error" && item.error_message ? (
                  <p className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{item.error_message}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold hover:bg-gray-50"
                  >
                    {item.status === "active" ? (
                      <>
                        <PowerOff className="h-3.5 w-3.5" />
                        Desactiver
                      </>
                    ) : (
                      <>
                        <Power className="h-3.5 w-3.5" />
                        Activer
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingConnector(item);
                      setOpenForm(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={openForm}
        onClose={closeForm}
        title={editingConnector ? "Modifier connecteur" : "Nouveau connecteur"}
        subtitle="Integrations avec services tiers"
        size="2xl"
      >
        <ConnectorForm
          connector={editingConnector}
          onSuccess={() => {
            setMessage(editingConnector ? "Connecteur mis a jour." : "Connecteur cree.");
            closeForm();
          }}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDangerDialog
        open={Boolean(deleteTarget)}
        title="Supprimer connecteur"
        message={`Supprimer le connecteur « ${deleteTarget?.name ?? ""} » ?`}
        confirmLabel="Supprimer"
        loading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCurrent}
      />
    </div>
  );
}

export const ConnectorsPageClient = memo(ConnectorsPageClientInner);
