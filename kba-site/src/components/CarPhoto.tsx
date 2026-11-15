import Image from "next/image";
import clsx from "clsx";
import type { Car } from "@/data/cars";

/** Photo principale, ou un panneau sobre quand les photos du parc ne sont pas encore reçues. */
export function CarPhoto({ car, index = 0, className, sizes, priority }: { car: Car; index?: number; className?: string; sizes?: string; priority?: boolean }) {
  const src = car.photos[index];
  if (src)
    return (
      <div className={clsx("relative overflow-hidden bg-silver-200", className)}>
        <Image src={src} alt={`${car.brand} ${car.model} ${car.year}, photo ${index + 1}`} fill sizes={sizes ?? "(min-width:1024px) 33vw, 100vw"} className="object-cover" priority={priority} />
      </div>
    );
  return (
    <div className={clsx("relative flex flex-col justify-between overflow-hidden bg-navy-900 p-5 text-white", className)}>
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:28px_28px]" />
      <span className="relative font-mono text-[10px] uppercase tracking-label text-blue-400">{car.ref}</span>
      <div className="relative">
        <p className="font-display text-2xl font-extrabold uppercase leading-none tracking-tight">{car.brand}</p>
        <p className="mt-1 font-display text-lg font-bold uppercase leading-tight text-white/80">{car.model}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-white/50">Photos du parc en cours de réception</p>
      </div>
    </div>
  );
}
