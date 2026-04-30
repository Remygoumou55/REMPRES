"use client";

import { useState, useTransition } from "react";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Globe,
} from "lucide-react";
import { formatMoney } from "@/lib/utils/formatCurrency";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CurrencyRow = {
  currency_code: string;
  rate_to_gnf: number;
  updated_at: string;
};

type Props = {
  rows: CurrencyRow[];
  isSuperAdmin: boolean;
};

// ---------------------------------------------------------------------------
// Config visuelle par devise
// ---------------------------------------------------------------------------

const CURRENCY_META: Record<string, { label: string; icon: string; color: string }> = {
  USD: { label: "Dollar américain", icon: "$",     color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  EUR: { label: "Euro",            icon: "€",     color: "text-sky-600 bg-sky-50 border-sky-200"             },
  XOF: { label: "Franc CFA",       icon: "FCFA",  color: "text-amber-600 bg-amber-50 border-amber-200"       },
  GNF: { label: "Franc Guinéen",   icon: "GNF",   color: "text-primary bg-primary/5 border-primary/20"       },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function staleness(iso: string): { label: string; isStale: boolean } {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH  = diffMs / (1000 * 60 * 60);
  if (diffH < 1)  return { label: "< 1 heure",          isStale: false };
  if (diffH < 24) return { label: `${Math.floor(diffH)} h`, isStale: false };
  return { label: `${Math.floor(diffH / 24)} j`,         isStale: true };
}

// ---------------------------------------------------------------------------
// Page client
// ---------------------------------------------------------------------------

export function CurrencyAdminClient({ rows, isSuperAdmin }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult]         = useState<{ success: boolean; message: string } | null>(null);

  function handleRefresh() {
    setResult(null);
    startTransition(async () => {
      try {
        const res  = await fetch("/api/currency/refresh?force=1", { cache: "no-store" });
        const data = await res.json();

        if (res.ok && data.rates) {
          setResult({ success: true, message: "Taux mis à jour avec succès depuis l'API externe." });
          // Reload la page pour afficher les nouvelles valeurs
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setResult({ success: false, message: data.error ?? "Échec de la mise à jour." });
        }
      } catch {
        setResult({ success: false, message: "Erreur réseau. Vérifiez la connexion." });
      }
    });
  }

  // Reconstruire les taux sous forme "1 GNF = X devises" pour affichage
  const gnfRow = { currency_code: "GNF", rate_to_gnf: 1, updated_at: rows[0]?.updated_at ?? new Date().toISOString() };
  const allRows = [gnfRow, ...rows.filter((r) => r.currency_code !== "GNF")];

  const mostRecent = rows.reduce<string | null>((acc, r) => {
    if (!acc) return r.updated_at;
    return r.updated_at > acc ? r.updated_at : acc;
  }, null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Globe size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-darktext">Taux de change</h1>
            <p className="text-xs text-gray-400">
              Base : Franc Guinéen (GNF) · Source : ExchangeRate-API
            </p>
          </div>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
          >
            <RefreshCw size={14} className={pending ? "animate-spin" : ""} />
            {pending ? "Mise à jour…" : "Forcer le rafraîchissement"}
          </button>
        )}
      </div>

      {/* ── Résultat de l'action ─────────────────────────────────────────── */}
      {result && (
        <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3.5 text-sm ${
          result.success
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {result.success
            ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
            : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          {result.message}
        </div>
      )}

      {/* ── Dernière mise à jour ─────────────────────────────────────────── */}
      {mostRecent && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          Dernière synchronisation : {formatDateTime(mostRecent)}
          <span className={`ml-1 rounded-full px-2 py-0.5 font-medium ${
            staleness(mostRecent).isStale
              ? "bg-red-100 text-red-600"
              : "bg-emerald-100 text-emerald-700"
          }`}>
            {staleness(mostRecent).label}
          </span>
        </div>
      )}

      {/* ── Grille des taux ──────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {allRows.map((row) => {
          const meta       = CURRENCY_META[row.currency_code] ?? { label: row.currency_code, icon: row.currency_code, color: "text-gray-600 bg-gray-50 border-gray-200" };
          // rate_to_gnf = combien de GNF pour 1 unité de cette devise
          // Ex: USD: rate_to_gnf = 8620 → 1 USD = 8 620 GNF
          const oneUnitInGNF = row.currency_code === "GNF" ? 1 : row.rate_to_gnf;
          const gnfPerUnit   = oneUnitInGNF;
          // Inverse : 1 GNF = combien d'unités
          const unitsPerGNF  = row.currency_code === "GNF" ? 1 : (1 / oneUnitInGNF);

          return (
            <div
              key={row.currency_code}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className={`flex items-center justify-between border-b px-4 py-3 ${meta.color.split(" ").slice(1).join(" ")}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`text-sm font-black ${meta.color.split(" ")[0]}`}>
                    {meta.icon}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-700">{row.currency_code}</p>
                    <p className="text-[10px] text-gray-400">{meta.label}</p>
                  </div>
                </div>
                <DollarSign size={14} className="text-gray-300" />
              </div>

              <div className="space-y-2 px-4 py-3">
                {row.currency_code === "GNF" ? (
                  <div className="text-sm text-gray-500">
                    <span className="font-bold text-darktext">1 GNF</span>
                    {" "}= devise de base
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-400">1 {row.currency_code} =</span>
                      <span className="text-base font-extrabold tabular-nums text-darktext">
                        {formatMoney(gnfPerUnit, "GNF", 1)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-gray-50 pt-2">
                      <span className="text-xs text-gray-400">1 GNF =</span>
                      <span className="text-xs font-semibold tabular-nums text-gray-500">
                        {row.currency_code === "USD" && `$${unitsPerGNF.toFixed(6)}`}
                        {row.currency_code === "EUR" && `${unitsPerGNF.toFixed(6)} €`}
                        {row.currency_code === "XOF" && `${unitsPerGNF.toFixed(4)} FCFA`}
                      </span>
                    </div>
                  </>
                )}

                {row.currency_code !== "GNF" && (
                  <div className="flex items-center gap-1 pt-1 text-[10px] text-gray-300">
                    <TrendingUp size={10} />
                    Mis à jour {formatDateTime(row.updated_at)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Note d'information ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-400 space-y-1">
        <p className="font-semibold text-gray-500">Comment ça fonctionne</p>
        <p>• Les taux sont rafraîchis automatiquement à la connexion si anciens de plus d'1 heure.</p>
        <p>• Le bouton "Forcer le rafraîchissement" appelle ExchangeRate-API immédiatement.</p>
        <p>• En cas d'échec de l'API externe, les derniers taux en base sont conservés.</p>
        <p>• Tous les montants dans l'application (panier, reçus, historique) utilisent ces taux.</p>
      </div>
    </div>
  );
}
