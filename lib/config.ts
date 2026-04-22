/**
 * lib/config.ts
 * Configuration globale de l'application RemPres.
 * Source unique de vérité — layout, PDF, navbar, metadata, liens absolus.
 *
 * USAGE :
 *   import { appConfig, getLogoUrl, getAbsoluteUrl } from "@/lib/config";
 */

// ---------------------------------------------------------------------------
// Core config
// ---------------------------------------------------------------------------

export const appConfig = {
  /** Nom court de l'application */
  name: "RemPres",

  /** Version sémantique */
  version: "1.0.0",

  /** Slogan / description courte */
  tagline: "Plateforme de gestion d'entreprise",

  /** URL de base de l'application (app.rempres.com en production) */
  baseUrl:
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),

  /** URL du site principal (rempres.com) */
  marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://rempres.com",

  // ── Assets ────────────────────────────────────────────────────────────────

  /** URL du logo principal (dans /public) */
  logoUrl: "/logo.png",

  /** Logo de secours si le principal ne charge pas */
  fallbackLogoUrl: "/fallback-logo.png",

  /** Devise de base — tous les montants sont stockés en GNF */
  currency: "GNF" as const,

  // ── Coordonnées (PDF, documents officiels) ────────────────────────────────

  country: "Guinée",
  address: "Conakry, République de Guinée",
  email: "contact@rempres.com",

  // ── Références de documents ───────────────────────────────────────────────
  /**
   * Ventes actuelles  : VNT-YYYY-NNNN (généré par trigger PostgreSQL)
   * Futur (factures)  : FAC-YYYY-NNNN — changer invoiceReferencePrefix
   */
  saleReferencePrefix:    "VNT",
  invoiceReferencePrefix: "FAC",
} as const;

export type AppConfig = typeof appConfig;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retourne l'URL du logo avec fallback.
 * Utilise l'URL principale si disponible, sinon le fallback.
 */
export function getLogoUrl(): string {
  return appConfig.logoUrl || appConfig.fallbackLogoUrl;
}

/**
 * Construit une URL absolue à partir d'un chemin relatif.
 * Utilisé pour les liens dans les emails, le PDF, les métadonnées OpenGraph.
 *
 * @example
 *   getAbsoluteUrl("/logo.png")
 *   // → "https://app.rempres.com/logo.png"
 */
export function getAbsoluteUrl(path: string): string {
  const base = appConfig.baseUrl.replace(/\/$/, "");
  const p    = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
