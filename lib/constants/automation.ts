export type ConfigField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "role";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

export type TriggerDefinition = {
  type: string;
  label: string;
  description: string;
  department: string;
  configFields: ConfigField[];
};

export type ConditionDefinition = {
  type: string;
  label: string;
  field: string;
  operators: (">" | "<" | "=" | ">=" | "<=")[];
  valueType: "number" | "text" | "select";
  selectOptions?: { value: string; label: string }[];
};

export type ActionDefinition = {
  type: string;
  label: string;
  description: string;
  configFields: ConfigField[];
};

export const TRIGGER_CATALOG: TriggerDefinition[] = [
  {
    type: "sale_validated",
    label: "Vente validée",
    description: "Quand une vente est validée",
    department: "Vente",
    configFields: [],
  },
  {
    type: "stock_low",
    label: "Stock sous le seuil",
    description: "Quand un article passe sous son seuil minimum",
    department: "Logistique",
    configFields: [],
  },
  {
    type: "lead_converted",
    label: "Lead converti en client",
    description: "Quand un lead marketing est converti",
    department: "Marketing",
    configFields: [],
  },
  {
    type: "expense_submitted",
    label: "Dépense soumise",
    description: "Quand une dépense est créée",
    department: "Finance",
    configFields: [
      {
        key: "threshold_gnf",
        label: "Seuil GNF (optionnel)",
        type: "number",
        required: false,
        placeholder: "Ex: 500000",
      },
    ],
  },
  {
    type: "task_overdue",
    label: "Tâche en retard",
    description: "Quand une tâche dépasse sa date limite",
    department: "Opérations",
    configFields: [],
  },
  {
    type: "employee_created",
    label: "Nouveau collaborateur",
    description: "Quand un employé est ajouté",
    department: "RH",
    configFields: [],
  },
  {
    type: "purchase_order_confirmed",
    label: "Commande fournisseur confirmée",
    description: "Quand une commande est confirmée",
    department: "Logistique",
    configFields: [],
  },
];

export const ACTION_CATALOG: ActionDefinition[] = [
  {
    type: "notify_role",
    label: "Notifier un rôle",
    description: "Envoie une notification à tous les utilisateurs d'un rôle",
    configFields: [
      {
        key: "role",
        label: "Rôle à notifier",
        type: "role",
        required: true,
        options: [
          { value: "super_admin", label: "Super Administrateur" },
          { value: "directeur_general", label: "Directeur Général" },
          { value: "responsable_vente", label: "Responsable Vente" },
          { value: "comptable", label: "Responsable Finance" },
          { value: "responsable_rh", label: "Responsable RH" },
          { value: "responsable_logistique", label: "Responsable Logistique" },
          { value: "responsable_marketing", label: "Responsable Marketing" },
          { value: "responsable_operations", label: "Responsable Opérations" },
        ],
      },
      {
        key: "message",
        label: "Message de notification",
        type: "text",
        required: true,
        placeholder: "Ex: Une vente importante a été validée",
      },
    ],
  },
  {
    type: "create_approval",
    label: "Créer une demande d'approbation",
    description: "Envoie une demande d'approbation au Super Admin",
    configFields: [
      {
        key: "title",
        label: "Titre de la demande",
        type: "text",
        required: true,
        placeholder: "Ex: Approbation requise",
      },
    ],
  },
];

export const CONDITION_CATALOG: ConditionDefinition[] = [
  {
    type: "amount_threshold",
    label: "Montant supérieur à",
    field: "amount_gnf",
    operators: [">", ">="],
    valueType: "number",
  },
  {
    type: "department_filter",
    label: "Département égal à",
    field: "department",
    operators: ["="],
    valueType: "select",
    selectOptions: [
      { value: "vente", label: "Vente" },
      { value: "finance", label: "Finance" },
      { value: "rh", label: "RH" },
      { value: "logistique", label: "Logistique" },
      { value: "marketing", label: "Marketing" },
      { value: "operations", label: "Opérations" },
    ],
  },
  {
    type: "priority_filter",
    label: "Priorité égale à",
    field: "priority",
    operators: ["="],
    valueType: "select",
    selectOptions: [
      { value: "urgent", label: "Urgente" },
      { value: "high", label: "Haute" },
      { value: "normal", label: "Normale" },
      { value: "low", label: "Basse" },
    ],
  },
];

export const DEPT_BADGE_COLORS: Record<string, string> = {
  Vente: "bg-blue-100 text-blue-800",
  Logistique: "bg-orange-100 text-orange-800",
  Marketing: "bg-pink-100 text-pink-800",
  Finance: "bg-emerald-100 text-emerald-800",
  Opérations: "bg-purple-100 text-purple-800",
  RH: "bg-violet-100 text-violet-800",
};

export function getRuleSummary(rule: {
  trigger_type: string;
  condition_type: string | null;
  action_type: string;
  action_config: Record<string, unknown>;
}): string {
  const trigger = TRIGGER_CATALOG.find((t) => t.type === rule.trigger_type);
  const action = ACTION_CATALOG.find((a) => a.type === rule.action_type);
  const t = trigger?.label ?? rule.trigger_type;
  const a = action?.label ?? rule.action_type;
  const cond = rule.condition_type
    ? CONDITION_CATALOG.find((c) => c.type === rule.condition_type)?.label
    : null;
  if (cond) return `Si "${t}" (${cond}) → ${a}`;
  return `Si "${t}" → ${a}`;
}
