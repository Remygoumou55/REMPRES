/**
 * Provider governance — Bloc 2 Étape 4.
 * Stack unique documenté ; pas de second QueryClient / i18n root.
 */
export const PROVIDER_GOVERNANCE_VERSION = "provider-governance-v1" as const;

export { PROVIDER_STACK } from "@/lib/performance/runtime-performance-registry";

/** QueryClient instancié une fois par session client (useState lazy init). */
export const QUERY_CLIENT_PATTERN = "useState(() => makeQueryClient())" as const;
