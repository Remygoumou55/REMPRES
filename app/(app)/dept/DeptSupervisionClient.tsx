"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { DEPARTMENT_LABELS } from "@/lib/constants/departments";

type SupervisionRow = {
  dept: string;
  clientsCount: number;
  productsCount: number;
  salesCount: number;
  activeUsers: number;
  lastActivity: string | null;
};

const DEPT_KEYS = ["vente", "finance", "rh", "formation", "consultation", "marketing", "logistique"] as const;

export function DeptSupervisionClient() {
  const [rows, setRows] = useState<SupervisionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await Promise.all(
        DEPT_KEYS.map(async (dept) => {
          const res = await fetch(`/api/dept/supervision?dept=${dept.toUpperCase()}`, { cache: "no-store" });
          if (!res.ok) return null;
          return (await res.json()) as SupervisionRow;
        }),
      );
      setRows(data.filter((row): row is SupervisionRow => Boolean(row)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => {
      void load();
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const mappedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        label: DEPARTMENT_LABELS[row.dept.toLowerCase()] ?? row.dept,
      })),
    [rows],
  );

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-darktext">Supervision des départements</h2>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {mappedRows.map((row) => (
          <article key={row.dept} className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-darktext">{row.label}</h3>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Clients</p>
                <p className="font-semibold text-darktext tabular-nums">{row.clientsCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Produits</p>
                <p className="font-semibold text-darktext tabular-nums">{row.productsCount}</p>
              </div>
              <div>
                <p className="text-gray-500">Ventes</p>
                <p className="font-semibold text-darktext tabular-nums">{row.salesCount}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Utilisateurs actifs: <span className="font-semibold text-darktext">{row.activeUsers}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Dernière activité:{" "}
              <span className="font-medium text-darktext">
                {row.lastActivity ? new Date(row.lastActivity).toLocaleString("fr-FR") : "—"}
              </span>
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

