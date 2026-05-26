export const REALTIME_CHANNELS = {
  /** Canal unique — toutes les tables métier ERP (voir `APP_REALTIME_WATCHED_TABLES`). */
  app: {
    global: "app-global-realtime",
  },
  governance: {
    alerts: "governance-alerts",
    approvals: "governance-approvals",
    audit: "governance-audit",
    intelligence: "governance-intelligence",
  },
  rh: {
    contracts: "rh-contracts-feed",
    recruitment: "rh-recruitment-feed",
  },
} as const;

