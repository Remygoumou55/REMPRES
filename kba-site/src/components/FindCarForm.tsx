"use client";
import { useState } from "react";
import { countries } from "@/data/countries";
import { waLink } from "@/lib/format";
import { WhatsAppGlyph } from "./icons";

const field = "h-11 w-full rounded-md border border-line bg-white px-3 text-[14px] text-ink outline-none placeholder:text-silver-500 focus:border-blue-600";

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={full ? "flex flex-col gap-1.5 sm:col-span-2" : "flex flex-col gap-1.5"}>
      <span className="text-[13px] font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

/** Formulaire sans serveur : il compose un message et l'ouvre dans WhatsApp. */
export function FindCarForm() {
  const [v, setV] = useState({ brand: "", model: "", yearMin: "", budget: "", fuel: "Indifférent", gearbox: "Automatique", country: "Guinée", link: "", name: "", city: "", note: "" });
  const on = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      "Bonjour KBA, je cherche une voiture :",
      `• Marque / modèle : ${v.brand} ${v.model}`.trim(),
      v.yearMin && `• Année minimum : ${v.yearMin}`,
      v.budget && `• Budget total : ${v.budget}`,
      `• Carburant : ${v.fuel} · Boîte : ${v.gearbox}`,
      `• Livraison : ${v.country}${v.city ? ` (${v.city})` : ""}`,
      v.link && `• Annonce : ${v.link}`,
      v.note && `• Précisions : ${v.note}`,
      `Mon nom : ${v.name}`,
    ].filter(Boolean);
    window.open(waLink(lines.join("\n")), "_blank", "noopener");
  };

  return (
    <form data-findcar="" onSubmit={submit} className="card grid gap-5 p-6 sm:grid-cols-2 md:p-8">
      <F label="Marque *"><input required value={v.brand} name="brand" onChange={on("brand")} placeholder="Hyundai, Kia, Toyota…" className={field} /></F>
      <F label="Modèle"><input value={v.model} name="model" onChange={on("model")} placeholder="Tucson, Sportage…" className={field} /></F>
      <F label="Année minimum"><input value={v.yearMin} name="yearMin" onChange={on("yearMin")} inputMode="numeric" placeholder="2018" className={field} /></F>
      <F label="Budget total (rendu port)"><input value={v.budget} name="budget" onChange={on("budget")} placeholder="15 000 $ ou 130 000 000 GNF" className={field} /></F>
      <F label="Carburant">
        <select value={v.fuel} name="fuel" onChange={on("fuel")} className={field}>{["Indifférent", "Essence", "Diesel", "Hybride"].map((o) => <option key={o}>{o}</option>)}</select>
      </F>
      <F label="Boîte">
        <select value={v.gearbox} name="gearbox" onChange={on("gearbox")} className={field}>{["Automatique", "Manuelle", "Indifférent"].map((o) => <option key={o}>{o}</option>)}</select>
      </F>
      <F label="Pays de livraison">
        <select value={v.country} name="country" onChange={on("country")} className={field}>{countries.map((c) => <option key={c.slug}>{c.name}</option>)}</select>
      </F>
      <F label="Ville"><input value={v.city} name="city" onChange={on("city")} placeholder="Conakry" className={field} /></F>
      <F label="Lien d'une annonce coréenne (facultatif)" full><input value={v.link} name="link" onChange={on("link")} type="url" placeholder="https://…" className={field} /></F>
      <F label="Précisions (couleur, options, usage…)" full><textarea value={v.note} name="note" onChange={on("note")} rows={3} className={`${field} h-auto py-2.5`} /></F>
      <F label="Votre nom *" full><input required value={v.name} name="name" onChange={on("name")} className={field} /></F>
      <div className="sm:col-span-2">
        <button type="submit" className="btn-whatsapp w-full py-3.5">
          <WhatsAppGlyph className="h-4 w-4" /> Envoyer ma demande sur WhatsApp
        </button>
        <p className="mt-3 text-center text-[12.5px] text-muted">Votre message s'ouvre dans WhatsApp, déjà rédigé. Rien n'est enregistré sur ce site.</p>
      </div>
    </form>
  );
}
