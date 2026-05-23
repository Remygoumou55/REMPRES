import { cache } from "react";
import { I18N_DEFAULT_LOCALE, normalizeLocale, type AppLocale } from "@/lib/i18n/config";

type MessageDict = Record<string, string>;

const BUNDLES = [
  "common",
  "navigation",
  "dashboard",
  "admin",
  "governance",
  "auth",
  "errors",
  "settings",
] as const;

/** Sous-ensemble pour le layout shell (moins de JSON à parser par navigation). */
export const SHELL_I18N_BUNDLES = ["common", "navigation", "errors"] as const;

const LOCALE_BUNDLE_LOADERS: Record<AppLocale, Record<(typeof BUNDLES)[number], () => Promise<{ default: MessageDict }>>> = {
  fr: {
    common: () => import("@/messages/fr/common.json"),
    navigation: () => import("@/messages/fr/navigation.json"),
    dashboard: () => import("@/messages/fr/dashboard.json"),
    admin: () => import("@/messages/fr/admin.json"),
    governance: () => import("@/messages/fr/governance.json"),
    auth: () => import("@/messages/fr/auth.json"),
    errors: () => import("@/messages/fr/errors.json"),
    settings: () => import("@/messages/fr/settings.json"),
  },
  en: {
    common: () => import("@/messages/en/common.json"),
    navigation: () => import("@/messages/en/navigation.json"),
    dashboard: () => import("@/messages/en/dashboard.json"),
    admin: () => import("@/messages/en/admin.json"),
    governance: () => import("@/messages/en/governance.json"),
    auth: () => import("@/messages/en/auth.json"),
    errors: () => import("@/messages/en/errors.json"),
    settings: () => import("@/messages/en/settings.json"),
  },
  zh: {
    common: () => import("@/messages/zh/common.json"),
    navigation: () => import("@/messages/zh/navigation.json"),
    dashboard: () => import("@/messages/zh/dashboard.json"),
    admin: () => import("@/messages/zh/admin.json"),
    governance: () => import("@/messages/zh/governance.json"),
    auth: () => import("@/messages/zh/auth.json"),
    errors: () => import("@/messages/zh/errors.json"),
    settings: () => import("@/messages/zh/settings.json"),
  },
  pt: {
    common: () => import("@/messages/pt/common.json"),
    navigation: () => import("@/messages/pt/navigation.json"),
    dashboard: () => import("@/messages/pt/dashboard.json"),
    admin: () => import("@/messages/pt/admin.json"),
    governance: () => import("@/messages/pt/governance.json"),
    auth: () => import("@/messages/pt/auth.json"),
    errors: () => import("@/messages/pt/errors.json"),
    settings: () => import("@/messages/pt/settings.json"),
  },
};

async function importBundle(locale: AppLocale, bundle: (typeof BUNDLES)[number]): Promise<MessageDict> {
  try {
    const mod = await LOCALE_BUNDLE_LOADERS[locale][bundle]();
    return (mod.default ?? {}) as MessageDict;
  } catch {
    if (locale === I18N_DEFAULT_LOCALE) return {};
    const fallbackMod = await LOCALE_BUNDLE_LOADERS[I18N_DEFAULT_LOCALE][bundle]();
    return (fallbackMod.default ?? {}) as MessageDict;
  }
}

async function loadBundles(locale: AppLocale, bundles: readonly (typeof BUNDLES)[number][]) {
  const all = await Promise.all(bundles.map((bundle) => importBundle(locale, bundle)));
  return Object.assign({}, ...all) as MessageDict;
}

/** Layout ERP — 3 bundles au lieu de 8 (common + navigation + errors). */
export const loadShellLocaleMessages = cache(async (inputLocale: string | null | undefined) => {
  const locale = normalizeLocale(inputLocale);
  const messages = await loadBundles(locale, SHELL_I18N_BUNDLES);
  return { locale, messages };
});

export const loadLocaleMessages = cache(async (inputLocale: string | null | undefined) => {
  const locale = normalizeLocale(inputLocale);
  const messages = await loadBundles(locale, BUNDLES);
  return { locale, messages };
});

export function translateFromDict(messages: MessageDict, key: string, fallback?: string): string {
  return messages[key] ?? fallback ?? key;
}
