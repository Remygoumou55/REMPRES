/**
 * Boundary d'isolation du domaine Administration/Supervision.
 * Gardé minimal pour éviter tout impact UI/logic métier.
 */
export default function AdminModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
