/**
 * Boundary d'isolation du domaine Finance.
 * Sépare explicitement l'arbre Finance pour futures optimisations dédiées.
 */
export default function FinanceModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
