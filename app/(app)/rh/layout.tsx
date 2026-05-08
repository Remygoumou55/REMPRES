/**
 * Boundary d'isolation du domaine RH.
 * Permet d'etendre le module sans impacter les autres departements.
 */
export default function RhModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

