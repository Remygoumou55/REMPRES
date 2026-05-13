/**
 * Layout départements : contenu seul (accès depuis l’accueil).
 * Plus de fil d’Ariane dupliqué — le contexte est porté par le shell.
 */
export default function DeptLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}
