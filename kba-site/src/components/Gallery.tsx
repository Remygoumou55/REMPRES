"use client";
import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Car } from "@/data/cars";
import { CarPhoto } from "./CarPhoto";

export function Gallery({ car }: { car: Car }) {
  const [i, setI] = useState(0);
  const n = car.photos.length;
  if (n === 0) return <CarPhoto car={car} className="aspect-[4/3] rounded-lg" />;
  const go = (d: number) => setI((x) => (x + d + n) % n);
  return (
    <div>
      <div className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-silver-200">
        <Image src={car.photos[i]} alt={`${car.brand} ${car.model}, photo ${i + 1} sur ${n}`} fill priority sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
        <span className="absolute bottom-3 left-3 rounded bg-navy-900/85 px-2 py-1 font-mono text-[11px] text-white">
          {i + 1} / {n}
        </span>
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Photo précédente" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => go(1)} aria-label="Photo suivante" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <div className="mt-3 grid grid-cols-6 gap-2">
        {car.photos.map((p, k) => (
          <button key={p} onClick={() => setI(k)} aria-label={`Voir la photo ${k + 1}`} className={clsx("relative aspect-[4/3] overflow-hidden rounded border-2", k === i ? "border-blue-600" : "border-transparent opacity-70 hover:opacity-100")}>
            <Image src={p} alt="" fill sizes="120px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
