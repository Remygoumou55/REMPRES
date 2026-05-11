import type { DashboardFoundationSnapshot } from "@/modules/dashboard-system/types";

/** Snapshot agrégé multi-domaines — enveloppe le foundation snapshot sans dupliquer le contrat KPI. */
export type ExecutiveGlobalSnapshot = DashboardFoundationSnapshot & {
  executiveMeta: {
    correlationId: string;
    domainsLoaded: number;
    domainsFailed: number;
  };
};

export type ExecutiveDomainHealth = "ok" | "partial" | "unavailable";

export type ExecutiveDomainSectionState = {
  key: string;
  health: ExecutiveDomainHealth;
  errorMessage?: string;
};
