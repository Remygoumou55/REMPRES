/** Clés `erp_infrastructure_jobs.queue_key` — une file par famille métier. */
export const INFRA_QUEUE_KEYS = {
  ecosystem: "ecosystem",
  platform: "platform",
  resilience: "resilience",
  governancePlatform: "governance_platform",
  cloud: "cloud",
  multitenant: "multitenant",
  ai: "ai",
  observability: "observability",
  compliance: "compliance",
  automation: "automation",
  analytics: "analytics",
  exports: "exports",
  realtimeFanout: "realtime_fanout",
  domainSync: "domain_sync",
  generic: "generic",
} as const;
