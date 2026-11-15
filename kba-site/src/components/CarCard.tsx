import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import type { Car } from "@/data/cars";
import { bodyLabel, totalPort } from "@/data/cars";
import { gnf, km, usd } from "@/lib/format";
import { CarPhoto } from "./CarPhoto";
import { ExampleBadge, StatusBadge } from "./ui";

export function CarCard({ car }: { car: Car }) {
  const total = totalPort(car);
  const docsOk = Object.values(car.docs).every(Boolean);
  return (
    <Link href={`/voitures/${car.slug}`} className="group card flex flex-col overflow-hidden transition-shadow hover:shadow-[0_12px_32px_-12px_rgba(11,31,58,0.25)]">
      <div className="relative">
        <CarPhoto car={car} className="aspect-[4/3] transition-transform duration-300 group-hover:scale-[1.015]" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <StatusBadge status={car.status} className="bg-white/95" />
        </div>
        {car.isExample && <ExampleBadge className="absolute right-3 top-3" />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-label text-muted">
          <span>{car.ref}</span>
          <span>{bodyLabel[car.body]}</span>
        </div>
        <h3 className="mt-2 text-[17px] font-semibold leading-snug text-ink">
          {car.brand} {car.model} <span className="font-normal text-muted">{car.version}</span>
        </h3>
        <p className="mt-1.5 text-[13px] text-muted">
          {car.year} · {km(car.km)} · {car.fuel} · {car.gearbox}
        </p>
        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-3 border-t border-line pt-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-label text-muted">Total rendu Conakry</p>
              <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-ink">{usd(total)}</p>
              <p className="text-[12px] text-muted">≈ {gnf(total)}</p>
            </div>
            {docsOk && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-ok">
                <ShieldCheck className="h-4 w-4" /> Dossier vérifié
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
