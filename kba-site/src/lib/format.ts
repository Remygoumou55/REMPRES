import { site } from "@/data/site";

const nf = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ /g, " ");

export const usd = (n: number) => `${nf(n)} $`;
export const km = (n: number) => `${nf(n)} km`;
/** Montant en francs guinéens, arrondi à 100 000 près. */
export const gnf = (usdAmount: number) => `${nf(Math.round((usdAmount * site.rates.GNF) / 100000) * 100000)} GNF`;
/** Montant en francs CFA, arrondi à 10 000 près. */
export const xof = (usdAmount: number) => `${nf(Math.round((usdAmount * site.rates.XOF) / 10000) * 10000)} FCFA`;
export const number = nf;

/** Lien WhatsApp avec un message pré-rempli. */
export const waLink = (message: string) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
