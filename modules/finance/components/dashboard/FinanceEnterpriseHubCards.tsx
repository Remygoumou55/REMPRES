import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BookMarked,
  BookOpen,
  ClipboardList,
  FileBarChart,
  Landmark,
  ListChecks,
  PieChart,
  Receipt,
  Scale,
  ScrollText,
} from "lucide-react";

const BASE = "/finance/enterprise";

type HubCard = { href: string; title: string; description: string; icon: LucideIcon };

const CARDS: HubCard[] = [
  {
    href: `${BASE}/journal`,
    title: "Journal comptable",
    description: "Lots d'écritures, statuts brouillon / comptabilisé.",
    icon: BookOpen,
  },
  {
    href: `${BASE}/grand-livre`,
    title: "Grand livre",
    description: "Mouvements postés par compte et par période.",
    icon: BookMarked,
  },
  {
    href: `${BASE}/balance`,
    title: "Balance générale",
    description: "Synthèse débits / crédits par compte.",
    icon: Scale,
  },
  {
    href: `${BASE}/facturation`,
    title: "Facturation AR",
    description: "Créances clients et états de facturation.",
    icon: ClipboardList,
  },
  {
    href: `${BASE}/paiements`,
    title: "Paiements",
    description: "Allocations et règlements enregistrés.",
    icon: ArrowLeftRight,
  },
  {
    href: `/finance/depenses`,
    title: "Dépenses",
    description: "Saisie et pilotage des dépenses (module historique).",
    icon: Receipt,
  },
  {
    href: `${BASE}/budgets`,
    title: "Budgets",
    description: "Enveloppes et lignes budgétaires.",
    icon: PieChart,
  },
  {
    href: `${BASE}/tresorerie`,
    title: "Trésorerie",
    description: "Soldes journaliers et agrégats.",
    icon: Landmark,
  },
  {
    href: `${BASE}/cashflow`,
    title: "Cashflow",
    description: "Vue courte sur les flux et la clôture.",
    icon: Activity,
  },
  {
    href: `${BASE}/reporting`,
    title: "Reporting",
    description: "Exports et packs de restitution.",
    icon: FileBarChart,
  },
  {
    href: `${BASE}/workflows`,
    title: "Approvals",
    description: "Liens vers le centre d'approbation gouvernance.",
    icon: ListChecks,
  },
  {
    href: `${BASE}/audit`,
    title: "Audit finance",
    description: "Piste opérationnelle et audit gouvernance.",
    icon: ScrollText,
  },
];

export function FinanceEnterpriseHubCards() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {CARDS.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.href}
            href={c.href}
            className="card block rounded-xl border border-gray-200 p-4 transition hover:border-primary/35 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-darktext">{c.title}</p>
                <p className="mt-1 text-xs text-gray-600">{c.description}</p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
