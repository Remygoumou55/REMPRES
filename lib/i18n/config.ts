export const I18N_SUPPORTED_LOCALES = ["fr", "en", "zh", "pt"] as const;

export type AppLocale = (typeof I18N_SUPPORTED_LOCALES)[number];

export const I18N_DEFAULT_LOCALE: AppLocale = "fr";

export function normalizeLocale(input: string | null | undefined): AppLocale {
  const raw = String(input ?? "").trim().toLowerCase();
  return (I18N_SUPPORTED_LOCALES as readonly string[]).includes(raw)
    ? (raw as AppLocale)
    : I18N_DEFAULT_LOCALE;
}
