/**
 * Administration — navigation sidebar uniquement (pas de bandeau horizontal).
 * Le bandeau GovernanceChrome a été retiré pour éviter le doublon avec la sidebar
 * (cf. patron identique sur /archives).
 */
export default function AdminModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
