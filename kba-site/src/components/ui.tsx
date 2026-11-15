import clsx from "clsx";
import type { ReactNode } from "react";
import type { CarStatus } from "@/data/cars";
import { statusLabel } from "@/data/cars";

/** En-tête de section : étiquette numérotée + titre + intro. */
export function SectionHeading({ eyebrow, title, intro, dark, className, action }: { eyebrow: string; title: ReactNode; intro?: ReactNode; dark?: boolean; className?: string; action?: ReactNode }) {
  return (
    <div className={clsx("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        <p className={dark ? "eyebrow-dark" : "eyebrow"}>{eyebrow}</p>
        <h2 className={clsx("h-section mt-3", dark ? "text-white" : "text-ink")}>{title}</h2>
        {intro && <p className={clsx("mt-4 text-[15px] leading-relaxed", dark ? "text-white/70" : "text-muted")}>{intro}</p>}
      </div>
      {action}
    </div>
  );
}

const statusStyle: Record<CarStatus, string> = {
  disponible: "bg-ok/10 text-ok",
  reservee: "bg-warn/10 text-warn",
  "en-route": "bg-blue-100 text-blue-700",
  livree: "bg-ink/5 text-muted",
};

export function StatusBadge({ status, className }: { status: CarStatus; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider", statusStyle[status], className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

export function ExampleBadge({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex rounded bg-ink/80 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white", className)} title="Voiture d'exemple : les vraies voitures seront publiées au lancement">
      Exemple
    </span>
  );
}

/** Bandeau de page intérieure. */
export function PageHeader({ eyebrow, title, intro, children }: { eyebrow: string; title: ReactNode; intro?: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b border-line bg-paper pb-12 pt-32 md:pb-16 md:pt-40">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h-display mt-4 max-w-4xl text-4xl text-ink md:text-6xl">{title}</h1>
        {intro && <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-muted">{intro}</p>}
        {children}
      </div>
    </section>
  );
}
