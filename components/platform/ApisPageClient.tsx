"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Plug, Trash2, Wifi } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { ApiForm } from "@/components/platform/ApiForm";
import type { ApiEntry } from "@/lib/server/platform";
import {
  API_STATUS_COLORS,
  API_STATUS_LABELS,
  API_TYPE_COLORS,
  API_TYPE_LABELS,
} from "@/lib/constants/platform";
import { deleteApiAction, pingApiAction } from "@/app/(app)/admin/platform/apis/actions";

type Props = {
  apis: ApiEntry[];
  activeCount: number;
};

function ApisPageClientInner({ apis, activeCount }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiEntry | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inactiveCount = apis.length - activeCount;
  const totalCalls = useMemo(
    () => apis.reduce((sum, item) => sum + Number(item.call_count ?? 0), 0),
    [apis],
  );

  function closeForm() {
    setOpenForm(false);
    setEditingApi(null);
  }

  function openCreate() {
    setEditingApi(null);
    setOpenForm(true);
  }

  function openEdit(api: ApiEntry) {
    setEditingApi(api);
    setOpenForm(true);
  }

  function deleteCurrent() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteApiAction(deleteTarget.id);
      setMessage(result.success ? "API supprimee." : result.error ?? "Suppression impossible.");
      setDeleteTarget(null);
    });
  }

  function pingFromList(item: ApiEntry) {
    if (!item.endpoint_url) return;
    startTransition(async () => {
      const res = await pingApiAction(item.endpoint_url!);
      setMessage(
        res.reachable
          ? `${item.name} accessible (${res.latency_ms ?? "-"}ms).`
          : `${item.name} inaccessible${res.error ? `: ${res.error}` : "."}`,
      );
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
            {activeCount} APIs actives
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
            {inactiveCount} inactives
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-800">
            {totalCalls} total appels
          </span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouvelle API
        </button>
      </div>

      {message ? <p className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-700">{message}</p> : null}

      {apis.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Plug className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune API enregistree</p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            Enregistrer la premiere API
          </button>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs text-gray-500">
                <th className="p-3">Nom</th>
                <th className="p-3">Type</th>
                <th className="p-3">URL</th>
                <th className="p-3">Auth</th>
                <th className="p-3">Appels</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apis.map((item) => {
                const typeColor = API_TYPE_COLORS[item.api_type];
                const statusColor = API_STATUS_COLORS[item.status];
                return (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <p className="font-semibold text-darktext">{item.name}</p>
                      <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                        {item.version}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: typeColor.bg, color: typeColor.text }}
                      >
                        {API_TYPE_LABELS[item.api_type]}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.endpoint_url ? (
                        <span className="max-w-56 truncate font-mono text-xs text-gray-600">
                          {item.endpoint_url}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {item.auth_type}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      <p className="font-semibold tabular-nums">{item.call_count}</p>
                      <p>{item.last_called_at ? new Date(item.last_called_at).toLocaleString("fr-FR") : "Jamais"}</p>
                    </td>
                    <td className="p-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {API_STATUS_LABELS[item.status]}
                      </span>
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
                          disabled={!item.endpoint_url || isPending}
                          onClick={() => pingFromList(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-50"
                        >
                          <Wifi className="h-3.5 w-3.5" />
                          Ping
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={openForm}
        onClose={closeForm}
        title={editingApi ? "Modifier API" : "Nouvelle API"}
        subtitle="Registre des APIs et connectivite"
        size="2xl"
      >
        <ApiForm
          api={editingApi}
          onSuccess={() => {
            setMessage(editingApi ? "API mise a jour." : "API creee.");
            closeForm();
          }}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDangerDialog
        open={Boolean(deleteTarget)}
        title="Supprimer API"
        message={`Supprimer l'API « ${deleteTarget?.name ?? ""} » ?`}
        confirmLabel="Supprimer"
        loading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteCurrent}
      />
    </div>
  );
}

export const ApisPageClient = memo(ApisPageClientInner);
