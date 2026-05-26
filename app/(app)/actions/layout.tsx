/**
 * Actions — navigation sidebar uniquement (pas de bandeau horizontal).
 * Le bandeau GovernanceChrome a été retiré pour éviter le doublon avec la sidebar.
 */
export default function ActionsModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
