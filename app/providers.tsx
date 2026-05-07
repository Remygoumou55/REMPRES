"use client";

import { CurrencyContextProvider } from "@/context/CurrencyContext";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { I18nProvider } from "@/providers/i18n-provider";
import { type AppLocale } from "@/lib/i18n/config";

type ProvidersProps = {
  locale: AppLocale;
  messages: Record<string, string>;
  children: React.ReactNode;
};

export function Providers({ locale, messages, children }: ProvidersProps) {
  return (
    <I18nProvider locale={locale} messages={messages}>
      <ToastProvider>
        <CurrencyContextProvider>{children}</CurrencyContextProvider>
      </ToastProvider>
    </I18nProvider>
  );
}
