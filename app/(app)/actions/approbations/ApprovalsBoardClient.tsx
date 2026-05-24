"use client";

import { useState, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { ACTION_TYPE_LABELS } from "@/lib/constants/sensitive-actions";
import { approveRequestAction, rejectRequestAction } from "./actions";

type ApprovalRecord = Record<string, unknown>;

const PRIORITY_CLASSES: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  normal: "bg-blue-100 text-blue-800",
  low: "bg-gray-100 text-gray-600",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  executed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-600",
  expired: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Rejetée",
  executed: "Exécutée",
  cancelled: "Annulée",
  expired: "Expirée",
};

function formatTimeAgo(value: unknown): string {
  if (!value || typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days} j`;
}

function ApprovalCard({ approval }: { approval: ApprovalRecord }) {
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [comment, setComment] = useState("");
  const [flash, setFlash] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const id = String(approval.id ?? "");
  const status = String(approval.status ?? "pending");
  const priority = String(approval.priority ?? "normal");
  const actionType = String(approval.action_type ?? "");
  const dept = String(approval.requester_dept ?? approval.department_key ?? "—");
  const targetLabel = String(approval.target_label ?? "—");
  const description = String(approval.description ?? approval.reason ?? "");
  const reviewComment = String(approval.review_comment ?? approval.rejection_reason ?? "");
  const createdAt = approval.created_at ?? approval.requested_at;

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveRequestAction(id, comment.trim() || undefined);
      if (result.error) {
        setFlash({ type: "error", message: result.error });
        return;
      }
      setFlash({ type: "success", message: "Demande approuvée et exécutée." });
      setMode("idle");
      setComment("");
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectRequestAction(id, comment);
      if (result.error) {
        setFlash({ type: "error", message: result.error });
        return;
      }
      setFlash({ type: "success", message: "Demande rejetée." });
      setMode("idle");
      setComment("");
    });
  };

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full px-2.5 py-0.5 font-semibold ${PRIORITY_CLASSES[priority] ?? PRIORITY_CLASSES.normal}`}
        >
          {priority}
        </span>
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">{dept}</span>
        <span className="ml-auto text-gray-400">{formatTimeAgo(createdAt)}</span>
      </div>

      <h2 className="mt-3 text-base font-bold text-gray-900">
        {ACTION_TYPE_LABELS[actionType] ?? actionType}
      </h2>
      <p className="mt-1 text-sm font-medium text-primary">{targetLabel}</p>
      <p className="mt-2 text-sm text-gray-600">{description}</p>

      {status !== "pending" ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASSES[status] ?? STATUS_CLASSES.pending}`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
          {reviewComment ? (
            <p className="text-sm text-gray-500">
              Commentaire : <span className="text-gray-700">{reviewComment}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {flash ? (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            flash.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {flash.message}
        </p>
      ) : null}

      {status === "pending" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {mode === "idle" ? (
            <>
              <button
                type="button"
                onClick={() => setMode("approve")}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Approuver
              </button>
              <button
                type="button"
                onClick={() => setMode("reject")}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Rejeter
              </button>
            </>
          ) : null}

          {mode === "approve" ? (
            <div className="w-full space-y-2">
              <label className="block text-sm font-medium text-gray-700">Commentaire (optionnel)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleApprove}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Confirmer l&apos;approbation
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}

          {mode === "reject" ? (
            <div className="w-full space-y-2">
              <label className="block text-sm font-medium text-gray-700">Raison du rejet *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending || !comment.trim()}
                  onClick={handleReject}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Confirmer le rejet
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function ApprovalsBoardClient({ approvals }: { approvals: ApprovalRecord[] }) {
  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
        <CheckCircle size={48} className="text-green-500" />
        <p className="mt-4 text-lg font-semibold text-gray-900">Aucune approbation en attente</p>
        <p className="mt-1 text-sm text-gray-500">Toutes les demandes ont été traitées.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <ApprovalCard key={String(approval.id)} approval={approval} />
      ))}
    </div>
  );
}
