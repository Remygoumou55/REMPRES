"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { GitMerge, Play, Zap } from "lucide-react";
import {
  ACTION_CATALOG,
  CONDITION_CATALOG,
  TRIGGER_CATALOG,
  getRuleSummary,
} from "@/lib/constants/automation";
import type { AutomationRule } from "@/lib/server/automation";
import {
  createRuleAction,
  updateRuleAction,
} from "@/app/(app)/admin/automation/rules/actions";

type Props = {
  rule?: AutomationRule | null;
  onSuccess: () => void;
  onCancel: () => void;
};

function groupTriggersByDepartment() {
  const map = new Map<string, typeof TRIGGER_CATALOG>();
  for (const t of TRIGGER_CATALOG) {
    const list = map.get(t.department) ?? [];
    list.push(t);
    map.set(t.department, list);
  }
  return Array.from(map.entries());
}

function RuleFormInner({ rule, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(rule?.id);
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [triggerType, setTriggerType] = useState(rule?.trigger_type ?? "");
  const [triggerConfig, setTriggerConfig] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(rule?.trigger_config ?? {}).map(([k, v]) => [k, String(v ?? "")]),
    ),
  );
  const [hasCondition, setHasCondition] = useState(Boolean(rule?.condition_type));
  const [conditionType, setConditionType] = useState(rule?.condition_type ?? "");
  const [conditionOperator, setConditionOperator] = useState(
    String((rule?.condition_config?.operator as string) ?? ">"),
  );
  const [conditionValue, setConditionValue] = useState(
    String((rule?.condition_config?.value as string | number) ?? ""),
  );
  const [actionType, setActionType] = useState(rule?.action_type ?? "");
  const [actionConfig, setActionConfig] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(rule?.action_config ?? {}).map(([k, v]) => [k, String(v ?? "")]),
    ),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedTrigger = TRIGGER_CATALOG.find((t) => t.type === triggerType);
  const selectedAction = ACTION_CATALOG.find((a) => a.type === actionType);
  const selectedCondition = CONDITION_CATALOG.find((c) => c.type === conditionType);

  const summary = useMemo(
    () =>
      getRuleSummary({
        trigger_type: triggerType || "—",
        condition_type: hasCondition && conditionType ? conditionType : null,
        action_type: actionType || "—",
        action_config: actionConfig,
      }),
    [triggerType, hasCondition, conditionType, actionType, actionConfig],
  );

  function validate(): string | null {
    if (!name.trim()) return "Le nom est obligatoire.";
    if (!triggerType) return "Sélectionnez un déclencheur.";
    if (!actionType) return "Sélectionnez une action.";
    if (selectedAction) {
      for (const field of selectedAction.configFields) {
        if (field.required && !actionConfig[field.key]?.trim()) {
          return `${field.label} est obligatoire.`;
        }
      }
    }
    if (hasCondition && !conditionType) return "Sélectionnez un type de condition.";
    if (hasCondition && !conditionValue.trim()) return "Valeur de condition requise.";
    return null;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      trigger_type: triggerType,
      trigger_config: Object.fromEntries(
        Object.entries(triggerConfig).filter(([, v]) => v !== ""),
      ),
      condition_type: hasCondition ? conditionType : null,
      condition_config: hasCondition
        ? { operator: conditionOperator, value: conditionValue, field: selectedCondition?.field }
        : {},
      action_type: actionType,
      action_config: actionConfig,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateRuleAction(rule!.id, payload)
        : await createRuleAction(payload);
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      onSuccess();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-darktext">Règle</h3>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">
            Nom de la règle <span className="text-red-600">*</span>
          </label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Alerte vente importante"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500">Description</label>
          <textarea
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-darktext">
          <Zap className="h-4 w-4 text-amber-600" />
          Déclencheur
        </h3>
        <select
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
          value={triggerType}
          onChange={(e) => {
            setTriggerType(e.target.value);
            setTriggerConfig({});
          }}
          required
        >
          <option value="">— Choisir un déclencheur —</option>
          {groupTriggersByDepartment().map(([dept, triggers]) => (
            <optgroup key={dept} label={dept}>
              {triggers.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {selectedTrigger ? (
          <p className="text-xs text-gray-500">{selectedTrigger.description}</p>
        ) : null}
        {selectedTrigger?.configFields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{field.label}</label>
            <input
              type={field.type === "number" ? "number" : "text"}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              placeholder={field.placeholder}
              value={triggerConfig[field.key] ?? ""}
              onChange={(e) =>
                setTriggerConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-darktext">
          <GitMerge className="h-4 w-4 text-indigo-600" />
          Condition (optionnelle)
        </h3>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={hasCondition}
            onChange={(e) => setHasCondition(e.target.checked)}
          />
          Ajouter une condition
        </label>
        {hasCondition ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={conditionType}
              onChange={(e) => {
                setConditionType(e.target.value);
                const cond = CONDITION_CATALOG.find((c) => c.type === e.target.value);
                if (cond) setConditionOperator(cond.operators[0] ?? "=");
              }}
            >
              <option value="">Type</option>
              {CONDITION_CATALOG.map((c) => (
                <option key={c.type} value={c.type}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={conditionOperator}
              onChange={(e) => setConditionOperator(e.target.value)}
            >
              {(selectedCondition?.operators ?? [">"]).map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            {selectedCondition?.valueType === "select" ? (
              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
              >
                <option value="">Valeur</option>
                {selectedCondition.selectOptions?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={selectedCondition?.valueType === "number" ? "number" : "text"}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={conditionValue}
                onChange={(e) => setConditionValue(e.target.value)}
                placeholder="Valeur"
              />
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-darktext">
          <Play className="h-4 w-4 text-emerald-600" />
          Action
        </h3>
        <select
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
          value={actionType}
          onChange={(e) => {
            setActionType(e.target.value);
            setActionConfig({});
          }}
          required
        >
          <option value="">— Choisir une action —</option>
          {ACTION_CATALOG.map((a) => (
            <option key={a.type} value={a.type}>
              {a.label}
            </option>
          ))}
        </select>
        {selectedAction ? (
          <p className="text-xs text-gray-500">{selectedAction.description}</p>
        ) : null}
        {selectedAction?.configFields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs font-medium text-gray-500">
              {field.label}
              {field.required ? <span className="text-red-600"> *</span> : null}
            </label>
            {field.type === "select" || field.type === "role" ? (
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={actionConfig[field.key] ?? ""}
                onChange={(e) =>
                  setActionConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              >
                <option value="">— Sélectionner —</option>
                {field.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder={field.placeholder}
                value={actionConfig[field.key] ?? ""}
                onChange={(e) =>
                  setActionConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            )}
          </div>
        ))}
      </section>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
        <span className="font-semibold text-gray-700">Résumé :</span> {summary}
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : isEdit ? "Mettre à jour" : "Enregistrer la règle"}
        </button>
      </div>
    </form>
  );
}

export const RuleForm = memo(RuleFormInner);
