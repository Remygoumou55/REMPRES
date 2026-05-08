"use client";

import Link from "next/link";
import { CheckCircle2, Bell, ShieldAlert } from "lucide-react";

export function ActionsPageClient() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2 text-darktext">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <h2 className="font-semibold">Approbations</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">Validation des actions sensibles.</p>
        <Link href="/admin/approvals" className="text-sm font-medium text-primary hover:underline">
          Ouvrir le centre d&apos;approbation →
        </Link>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2 text-darktext">
          <Bell size={18} className="text-amber-600" />
          <h2 className="font-semibold">Alertes</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">Incidents critiques et anomalies.</p>
        <Link href="/admin/alerts" className="text-sm font-medium text-primary hover:underline">
          Ouvrir les alertes →
        </Link>
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2 text-darktext">
          <ShieldAlert size={18} className="text-violet-600" />
          <h2 className="font-semibold">Audit entreprise</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">Traçabilité et conformité globale.</p>
        <Link href="/admin/audit" className="text-sm font-medium text-primary hover:underline">
          Ouvrir l&apos;audit →
        </Link>
      </section>
    </div>
  );
}

