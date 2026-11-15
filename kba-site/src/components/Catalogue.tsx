"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { Body, Car } from "@/data/cars";
import { bodyLabel, totalPort } from "@/data/cars";
import { CarCard } from "./CarCard";
import { number } from "@/lib/format";

const tabs: { key: "all" | Body; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "suv", label: "SUV" },
  { key: "berline", label: "Berlines" },
  { key: "compacte", label: "Compactes" },
  { key: "citadine", label: "Citadines" },
  { key: "utilitaire", label: "Utilitaires" },
  { key: "minibus", label: "Minibus" },
];

const sorts = {
  recent: { label: "Plus récentes", fn: (a: Car, b: Car) => b.addedAt.localeCompare(a.addedAt) },
  priceAsc: { label: "Prix croissant", fn: (a: Car, b: Car) => totalPort(a) - totalPort(b) },
  priceDesc: { label: "Prix décroissant", fn: (a: Car, b: Car) => totalPort(b) - totalPort(a) },
  kmAsc: { label: "Kilométrage le plus bas", fn: (a: Car, b: Car) => a.km - b.km },
  yearDesc: { label: "Année la plus récente", fn: (a: Car, b: Car) => b.year - a.year },
} as const;

const PAGE = 12;

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-label text-muted">{label}</span>
      <select data-filter={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-md border border-line bg-white px-3 text-[14px] text-ink outline-none focus:border-blue-600">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Catalogue({ cars, brands }: { cars: Car[]; brands: string[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [fuel, setFuel] = useState("");
  const [gearbox, setGearbox] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxKm, setMaxKm] = useState("");
  const [sort, setSort] = useState<keyof typeof sorts>("recent");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return cars
      .filter((c) => tab === "all" || c.body === tab)
      .filter((c) => !s || `${c.brand} ${c.model} ${c.version} ${c.ref}`.toLowerCase().includes(s))
      .filter((c) => !brand || c.brand === brand)
      .filter((c) => !fuel || c.fuel === fuel)
      .filter((c) => !gearbox || c.gearbox === gearbox)
      .filter((c) => !maxPrice || totalPort(c) <= +maxPrice)
      .filter((c) => !minYear || c.year >= +minYear)
      .filter((c) => !maxKm || c.km <= +maxKm)
      .sort(sorts[sort].fn);
  }, [cars, tab, q, brand, fuel, gearbox, maxPrice, minYear, maxKm, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice((page - 1) * PAGE, page * PAGE);
  const active = [brand, fuel, gearbox, maxPrice, minYear, maxKm].filter(Boolean).length;
  const reset = () => { setBrand(""); setFuel(""); setGearbox(""); setMaxPrice(""); setMinYear(""); setMaxKm(""); setQ(""); setTab("all"); setPage(1); };
  const set = (fn: (v: string) => void) => (v: string) => { fn(v); setPage(1); };
  const years = Array.from(new Set(cars.map((c) => c.year))).sort((a, b) => b - a);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <span className="sr-only">Rechercher</span>
          <input data-search-input="" value={q} onChange={(e) => set(setQ)(e.target.value)} placeholder="Marque, modèle ou numéro KBA" className="h-12 w-full rounded-md border border-line bg-white pl-10 pr-4 text-[14px] outline-none placeholder:text-muted focus:border-blue-600" />
        </label>
        <button type="button" onClick={() => setShowFilters((s) => !s)} className="btn-outline h-12 md:hidden">
          <SlidersHorizontal className="h-4 w-4" /> Filtres {active > 0 && `(${active})`}
        </button>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Type de véhicule">
        {tabs.map((t) => {
          const count = t.key === "all" ? cars.length : cars.filter((c) => c.body === t.key).length;
          return (
            <button
              key={t.key}
              role="tab"
              data-tab={t.key}
              aria-selected={tab === t.key}
              onClick={() => set(() => setTab(t.key))("")}
              className={clsx("shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors", tab === t.key ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-muted hover:border-ink/30 hover:text-ink")}
            >
              {t.label} <span className={clsx("ml-1 font-mono text-[11px]", tab === t.key ? "text-white/60" : "text-silver-500")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className={clsx("mt-5 grid gap-4 rounded-lg border border-line bg-paper p-5 sm:grid-cols-3 lg:grid-cols-6", !showFilters && "hidden md:grid")}>
        <Select label="Marque" value={brand} onChange={set(setBrand)} options={[["", "Toutes"], ...brands.map((b) => [b, b] as [string, string])]} />
        <Select label="Carburant" value={fuel} onChange={set(setFuel)} options={[["", "Tous"], ["Essence", "Essence"], ["Diesel", "Diesel"], ["Hybride", "Hybride"]]} />
        <Select label="Boîte" value={gearbox} onChange={set(setGearbox)} options={[["", "Toutes"], ["Automatique", "Automatique"], ["Manuelle", "Manuelle"]]} />
        <Select label="Budget max. (rendu port)" value={maxPrice} onChange={set(setMaxPrice)} options={[["", "Indifférent"], ...[8000, 10000, 12000, 15000, 20000, 30000].map((v) => [String(v), `${number(v)} $`] as [string, string])]} />
        <Select label="Année min." value={minYear} onChange={set(setMinYear)} options={[["", "Indifférent"], ...years.map((y) => [String(y), String(y)] as [string, string])]} />
        <Select label="Km max." value={maxKm} onChange={set(setMaxKm)} options={[["", "Indifférent"], ...[50000, 80000, 100000, 150000].map((v) => [String(v), `${number(v)} km`] as [string, string])]} />
      </div>

      <div className="mt-8 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] text-muted">
          <span data-count="" className="font-semibold text-ink">{filtered.length}</span> voiture{filtered.length > 1 ? "s" : ""}
          {tab !== "all" && <> · {bodyLabel[tab]}</>}
          {(active > 0 || q || tab !== "all") && (
            <button onClick={reset} className="ml-3 inline-flex items-center gap-1 text-blue-600 hover:underline">
              <X className="h-3.5 w-3.5" /> Effacer les filtres
            </button>
          )}
        </p>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          Trier :
          <select data-sort="" value={sort} onChange={(e) => setSort(e.target.value as keyof typeof sorts)} className="h-9 rounded-md border border-line bg-white px-2 text-[13px] text-ink">
            {Object.entries(sorts).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {shown.length > 0 ? (
        <div data-grid="" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <CarCard key={c.slug} car={c} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-line p-12 text-center">
          <p className="text-[15px] font-semibold text-ink">Aucune voiture ne correspond à votre recherche.</p>
          <p className="mt-2 text-[14px] text-muted">Notre équipe peut la chercher pour vous dans les parcs coréens.</p>
          <Link href="/trouvez-ma-voiture" className="btn-primary mt-6">
            Trouvez-la pour moi
          </Link>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-10 flex justify-center gap-2" aria-label="Pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-current={n === page ? "page" : undefined} className={clsx("h-10 w-10 rounded-md border font-mono text-[13px]", n === page ? "border-navy-900 bg-navy-900 text-white" : "border-line text-muted hover:text-ink")}>
              {n}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
