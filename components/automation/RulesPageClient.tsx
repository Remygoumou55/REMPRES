"use client";

import { memo, useState, useTransition } from "react";
import { Pencil, Trash2, Zap } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { RuleForm } from "@/components/automation/RuleForm";
import { RuleToggle } from "@/components/automation/RuleToggle";
import {
  ACTION_CATALOG,
  DEPT_BADGE_COLORS,
  TRIGGER_CATALOG,
} from "@/lib/constants/automation";
import type { AutomationRule } from "@/lib/server/automation";
import { deleteRuleAction } from "@/app/(app)/admin/automation/rules/actions";

type Props = {
  rules: AutomationRule[];
  activeCount: number;
  totalExecutions: number;
};

function triggerDept(triggerType: string): string {
  return TRIGGER_CATALOG.find((t) => t.type === triggerType)?.department ?? "—";
}

function RulesPageClientInner({ rules, activeCount, totalExecutions }: Props) {
  const [openForm, setOpenForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AutomationRule | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const inactiveCount = rules.length - activeCount;

  function openCreate() {
    setEditingRule(null);
    setOpenForm(true);
  }

  function openEdit(rule: AutomationRule) {
    setEditingRule(rule);
    setOpenForm(true);
  }

  function closeForm() {
    setOpenForm(false);
    setEditingRule(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteRuleAction(deleteTarget.id);
      setMessage(result.success ? "Règle supprimée." : result.error ?? "Suppression impossible.");
      setDeleteTarget(null);
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
            {activeCount} règle{activeCount > 1 ? "s" : ""} active{activeCount > 1 ? "s" : ""}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
            {inactiveCount} inactive{inactiveCount > 1 ? "s" : ""}
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-800">
            {totalExecutions} exécution{totalExecutions > 1 ? "s" : ""} totale
            {totalExecutions > 1 ? "s" : ""}
          </span>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
        >
          Nouvelle règle
        </button>
      </div>

      {message ? (
        <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
          {message}
        </p>
      ) : null}

      {rules.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Zap className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucune règle d&apos;automation</p>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            Créer la première règle
          </button>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-3">Statut</th>
                <th className="p-3">Règle</th>
                <th className="p-3">Résumé</th>
                <th className="p-3">Déclencheur</th>
                <th className="p-3">Action</th>
                <th className="p-3 text-right">Exécutions</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => {
                const dept = triggerDept(rule.trigger_type);
                const deptClass = DEPT_BADGE_COLORS[dept] ?? "bg-gray-100 text-gray-700";
                const actionLabel =
                  ACTION_CATALOG.find((a) => a.type === rule.action_type)?.label ??
                  rule.action_type;
                return (
                  <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <RuleToggle
                        ruleId={rule.id}
                        isActive={rule.is_active}
                        ruleName={rule.name}
                      />
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-darktext">{rule.name}</p>
                      {rule.description ? (
                        <p className="text-xs text-gray-400">{rule.description}</p>
                      ) : null}
                    </td>
                    <td className="max-w-xs p-3 text-xs italic text-gray-500">{rule.summary}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${deptClass}`}>
                        {dept}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-800">
                        {actionLabel}
                      </span>
                    </td>
                    <td className="p-3 text-right text-xs text-gray-600">
                      <p className="tabular-nums font-semibold">{rule.execution_count}</p>
                      {rule.last_executed_at ? (
                        <p>{new Date(rule.last_executed_at).toLocaleString("fr-FR")}</p>
                      ) : (
                        <p>—</p>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(rule)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(rule)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
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
        title={editingRule ? "Modifier la règle" : "Nouvelle règle"}
        subtitle="Déclencheur → condition → action"
        size="3xl"
      >
        <RuleForm
          rule={editingRule}
          onSuccess={() => {
            setMessage(editingRule ? "Règle mise à jour." : "Règle créée.");
            closeForm();
          }}
          onCancel={closeForm}
        />
      </Modal>

      <ConfirmDangerDialog
        open={Boolean(deleteTarget)}
        title="Supprimer la règle"
        message={`Supprimer définitivement la règle « ${deleteTarget?.name ?? ""} » ?`}
        confirmLabel="Supprimer"
        loading={isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export const RulesPageClient = memo(RulesPageClientInner);
