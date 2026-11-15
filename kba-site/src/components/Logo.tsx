import Link from "next/link";
import clsx from "clsx";

/** Logo KBA (piste n°7). variant « dark » = texte blanc, pour fond bleu nuit. */
export function Logo({ variant = "light", className }: { variant?: "light" | "dark"; className?: string }) {
  const src = variant === "dark" ? "/brand/kba-symbole-sombre.svg" : "/brand/kba-symbole-clair.svg";
  return (
    <Link href="/" className={clsx("group inline-flex items-center gap-3", className)} aria-label="Korea Business Auto, accueil">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={600} height={290} className="h-10 w-auto" />
      <span className={clsx("hidden border-l pl-3 font-mono text-[10px] uppercase leading-tight tracking-label sm:block", variant === "dark" ? "border-white/20 text-white/70" : "border-line text-muted")}>
        Korea
        <br />
        Business Auto
      </span>
    </Link>
  );
}
