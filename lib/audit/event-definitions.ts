export type GovernanceEventCategory =
  | "SECURITY"
  | "GOVERNANCE"
  | "SALES"
  | "FINANCE"
  | "RH"
  | "FORMATION"
  | "SYSTEM"
  | "INVITATION"
  | "ARCHIVE"
  | "APPROVAL"
  | "CONFIGURATION";

export type GovernanceEventSeverity = "info" | "success" | "warning" | "critical";

export type GovernanceEventDefinition = {
  id: string;
  moduleKey: string;
  actionKey: string;
  labelKey: string;
  category: GovernanceEventCategory;
  severity: GovernanceEventSeverity;
  governanceVisible: boolean;
  icon: "plus" | "pencil" | "trash" | "download" | "shield" | "refresh" | "activity";
};

const defs: GovernanceEventDefinition[] = [
  {
    id: "clients.delete",
    moduleKey: "clients",
    actionKey: "delete",
    labelKey: "governance.activity.action.clientDeleted",
    category: "SALES",
    severity: "critical",
    governanceVisible: true,
    icon: "trash",
  },
  {
    id: "products.archive",
    moduleKey: "produits",
    actionKey: "archive",
    labelKey: "governance.activity.action.productArchived",
    category: "ARCHIVE",
    severity: "warning",
    governanceVisible: true,
    icon: "download",
  },
  {
    id: "users.invite",
    moduleKey: "users",
    actionKey: "invite",
    labelKey: "governance.activity.action.invite",
    category: "INVITATION",
    severity: "success",
    governanceVisible: true,
    icon: "plus",
  },
  {
    id: "users.permission_update",
    moduleKey: "users",
    actionKey: "permission_update",
    labelKey: "governance.activity.action.permission_update",
    category: "CONFIGURATION",
    severity: "warning",
    governanceVisible: true,
    icon: "shield",
  },
  {
    id: "users.role_update",
    moduleKey: "users",
    actionKey: "role_update",
    labelKey: "governance.activity.action.role_update",
    category: "GOVERNANCE",
    severity: "warning",
    governanceVisible: true,
    icon: "pencil",
  },
  {
    id: "system.config_update",
    moduleKey: "configuration",
    actionKey: "config_update",
    labelKey: "governance.activity.action.config_update",
    category: "SYSTEM",
    severity: "critical",
    governanceVisible: true,
    icon: "shield",
  },
];

const byPair = new Map<string, GovernanceEventDefinition>();
for (const def of defs) {
  byPair.set(`${def.moduleKey}:${def.actionKey}`, def);
}

function normalizeActionKey(actionKey: string): string {
  return String(actionKey ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

export function resolveGovernanceEvent(moduleKey: string, actionKey: string): GovernanceEventDefinition {
  const moduleNorm = String(moduleKey ?? "").trim().toLowerCase();
  const actionNorm = normalizeActionKey(actionKey);
  const matched = byPair.get(`${moduleNorm}:${actionNorm}`);
  if (matched) return matched;

  return {
    id: `${moduleNorm}.${actionNorm || "update"}`,
    moduleKey: moduleNorm || "system",
    actionKey: actionNorm || "update",
    labelKey: `governance.activity.action.${actionNorm || "update"}`,
    category: "GOVERNANCE",
    severity: actionNorm === "delete" ? "critical" : "info",
    governanceVisible: true,
    icon: actionNorm === "delete" ? "trash" : "activity",
  };
}
