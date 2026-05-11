/** Contexte multi-tenant exécutif — extension sans colonne métier sur les agrégats actuels. */
export type ExecutiveTenantContext = {
  tenantId: string | null;
  label: string | null;
};
