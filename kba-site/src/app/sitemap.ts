import type { MetadataRoute } from "next";
import { cars } from "@/data/cars";
import { countries } from "@/data/countries";
import { guides } from "@/data/guides";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/voitures", "/comment-acheter", "/verifiez-nous", "/trouvez-ma-voiture", "/pays", "/guides", "/a-propos", "/contact", "/faq"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...cars.filter((c) => !c.isExample).map((c) => ({ url: `${site.url}/voitures/${c.slug}`, lastModified: c.addedAt })),
    ...countries.map((c) => ({ url: `${site.url}/pays/${c.slug}` })),
    ...guides.map((g) => ({ url: `${site.url}/guides/${g.slug}`, lastModified: g.date })),
  ];
}
