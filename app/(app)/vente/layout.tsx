/**
 * Boundary d'isolation du domaine Vente.
 * Permet d'ajouter des providers/cache spécifiques au module sans toucher les autres départements.
 */
export default function VenteModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
