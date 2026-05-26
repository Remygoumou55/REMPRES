"use client";

import { Suspense, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { CurrencyContextProvider } from "@/context/CurrencyContext";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { I18nProvider } from "@/providers/i18n-provider";
import { type AppLocale } from "@/lib/i18n/config";
import { makeQueryClient } from "@/lib/queryClient";
import { AppRealtimeBridge } from "@/components/providers/AppRealtimeBridge";
import { ApprovalPendingNoticeBridge } from "@/components/governance/approvals/ApprovalPendingNoticeBridge";

type ProvidersProps = {
  locale: AppLocale;
  messages: Record<string, string>;
  children: React.ReactNode;
};

export function Providers({ locale, messages, children }: ProvidersProps) {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <I18nProvider locale={locale} messages={messages}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CurrencyContextProvider>
            {children}
            <AppRealtimeBridge />
            <Suspense fallback={null}>
              <ApprovalPendingNoticeBridge />
            </Suspense>
          </CurrencyContextProvider>
        </ToastProvider>
      </QueryClientProvider>
    </I18nProvider>
  );
}
