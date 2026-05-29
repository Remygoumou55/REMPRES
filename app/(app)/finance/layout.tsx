import { FinanceModuleNav } from "@/components/finance/FinanceModuleNav";

/**
 * Boundary d'isolation du domaine Finance.
 * Sépare explicitement l'arbre Finance pour futures optimisations dédiées.
 */
export default function FinanceModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="page-wrapper pb-0 pt-6">
        <FinanceModuleNav />
      </div>
      {children}
    </>
  );
}
