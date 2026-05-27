"use client";

import { memo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, FileDown, Package, Play, Plus } from "lucide-react";
import type { InventorySession } from "@/lib/server/inventory";
import {
  createInventorySessionAction,
  fetchInventoryReportDataAction,
  startSessionAction,
  validateSessionAction,
} from "@/app/(app)/logistique/inventaire/actions";
import { downloadInventoryReport } from "@/components/logistique/InventoryReportPDF";
import {
  Modal,
  ModalActions,
  ModalError,
  ModalField,
  ModalInput,
  ModalTextarea,
} from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-danger-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateDayFr } from "@/lib/utils/formatDate";

const STATUS_BADGE: Record<
  InventorySession["status"],
  { label: string; className: string }
> = {
  draft: { label: "Brouillon", className: "bg-gray-100 text-gray-700" },
  in_progress: { label: "En cours", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Terminé", className: "bg-blue-100 text-blue-800" },
  validated: { label: "Validé", className: "bg-emerald-100 text-emerald-800" },
};

type Props = {
  sessions: InventorySession[];
  canWrite: boolean;
};

function InventaireSessionsClientInner({ sessions, canWrite }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [validateId, setValidateId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      setFormError(null);
      const result = await createInventorySessionAction(fd);
      if (!result.success) {
        setFormError(result.error ?? "Échec de création.");
        return;
      }
      setFormOpen(false);
      if (result.id) {
        router.push(`/logistique/inventaire/${result.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const onStart = (sessionId: string) => {
    startTransition(async () => {
      setActionError(null);
      const result = await startSessionAction(sessionId);
      if (!result.success) {
        setActionError(result.error ?? "Impossible de démarrer.");
        return;
      }
      router.push(`/logistique/inventaire/${sessionId}`);
    });
  };

  const onValidate = () => {
    if (!validateId) return;
    startTransition(async () => {
      setActionError(null);
      const result = await validateSessionAction(validateId);
      if (!result.success) {
        setActionError(result.error ?? "Validation impossible.");
        return;
      }
      setValidateId(null);
      router.refresh();
    });
  };

  const onDownloadPdf = async (session: InventorySession) => {
    const { session: fresh, lines } = await fetchInventoryReportDataAction(session.id);
    if (!fresh) return;
    await downloadInventoryReport(fresh, lines);
  };

  return (
    <>
      <PageHeader
        title="Inventaire périodique"
        subtitle="Comptage physique et ajustement des stocks"
        actions={
          canWrite ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nouvel inventaire
            </button>
          ) : null
        }
      />

      {actionError ? (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {actionError}
        </p>
      ) : null}

      {sessions.length === 0 ? (
        <section className="card flex flex-col items-center gap-4 p-12 text-center text-gray-500">
          <Package className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun inventaire créé</p>
          {canWrite ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Nouvel inventaire
            </button>
          ) : null}
        </section>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Items comptés</th>
                <th className="px-4 py-3">Écarts</th>
                <th className="px-4 py-3">Créé le</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const badge = STATUS_BADGE[session.status];
                return (
                  <tr key={session.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-medium text-darktext">
                      {session.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {session.total_items_counted}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {session.total_discrepancies}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDateDayFr(session.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {session.status === "draft" && canWrite ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => onStart(session.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Démarrer
                        </button>
                      ) : null}
                      {session.status === "in_progress" ? (
                        <Link
                          href={`/logistique/inventaire/${session.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          Saisir les comptes
                        </Link>
                      ) : null}
                      {session.status === "completed" && canWrite ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setValidateId(session.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Valider
                        </button>
                      ) : null}
                      {session.status === "validated" ? (
                        <button
                          type="button"
                          onClick={() => void onDownloadPdf(session)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          Rapport PDF
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => !pending && setFormOpen(false)}
        title="Nouvel inventaire"
        subtitle="Un instantané du stock actuel sera créé"
        icon={<ClipboardList size={18} />}
        size="lg"
        scrollable={false}
      >
        <form onSubmit={onCreate} className="space-y-4">
          <ModalField label="Nom de la session" required>
            <ModalInput name="name" required placeholder="ex. Inventaire T1 2026" />
          </ModalField>
          <ModalField label="Notes">
            <ModalTextarea name="notes" rows={2} placeholder="Optionnel…" />
          </ModalField>
          <ModalError message={formError} />
          <ModalActions
            onCancel={() => setFormOpen(false)}
            submitLabel="Créer"
            loading={pending}
            submitLoadingText="Création…"
            submitIcon={<Plus size={14} />}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!validateId}
        tone="primary"
        title="Valider l'inventaire"
        subtitle="Action irréversible"
        message="Les écarts seront appliqués au stock via des mouvements d'ajustement. Cette opération ne peut pas être annulée."
        confirmLabel="Valider définitivement"
        loading={pending}
        onCancel={() => setValidateId(null)}
        onConfirm={onValidate}
      />
    </>
  );
}

export const InventaireSessionsClient = memo(InventaireSessionsClientInner);
