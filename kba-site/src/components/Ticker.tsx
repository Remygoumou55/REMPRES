const items = ["Voitures vérifiées", "Prix total sans surprise", "Paiement à l'entreprise qui vend", "Vidéo à votre nom", "Suivi du bateau en direct", "Volant à gauche", "Douane payée au transitaire", "Remise des clés à Conakry"];

/** Bandeau défilant des promesses KBA. */
export function Ticker() {
  const row = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-white/10 bg-navy-950 py-3.5" aria-label={items.join(", ")}>
      <div className="flex w-max animate-ticker gap-10 pr-10" aria-hidden="true">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap font-mono text-[11px] uppercase tracking-label text-white/70">
            {t}
            <span className="h-1 w-1 rotate-45 bg-blue-400" />
          </span>
        ))}
      </div>
    </div>
  );
}
