/**
 * Paramètres — navigation sidebar uniquement (pas de bandeau horizontal).
 * Le bandeau GovernanceChrome a été retiré pour supprimer la confusion lorsque
 * l'utilisateur arrive sur /settings/users depuis l'item Utilisateurs.
 */
export default function SettingsModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
