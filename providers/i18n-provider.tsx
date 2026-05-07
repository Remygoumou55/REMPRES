"use client";

import { createContext, useContext, useMemo } from "react";
import { I18N_DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n/config";

type I18nContextValue = {
  locale: AppLocale;
  messages: Record<string, string>;
};

const I18nContext = createContext<I18nContextValue>({
  locale: I18N_DEFAULT_LOCALE,
  messages: {},
});

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: Record<string, string>;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, messages }), [locale, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext() {
  return useContext(I18nContext);
}
