/**
 * Administration — espacement vertical unifié (sans fil d’Ariane dupliqué : le shell porte le contexte).
 */
export default function AdminModuleLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
