"use client";

import Link from "next/link";
import { Archive } from "lucide-react";
import { DEPARTMENT_LABELS } from "@/lib/constants/departments";

export function ArchivesPageClient() {
  return (
    <>
      <section className="card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Archive size={18} className="text-primary" />
          <h2 className="font-semibold text-darktext">Archives globales</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Les archives détaillées (clients et produits) restent disponibles dans le module historique existant.
        </p>
        <Link href="/admin/archives" className="text-sm font-medium text-primary hover:underline">
          Ouvrir les archives globales →
        </Link>
      </section>

      <section className="card p-5">
        <h2 className="section-title">Archives par département</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(DEPARTMENT_LABELS).map((label) => (
            <div key={label} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              {label}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

