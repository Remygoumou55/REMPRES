"use client";

import { useCallback } from "react";
import { useI18nContext } from "@/providers/i18n-provider";

export function useTranslation() {
  const { locale, messages } = useI18nContext();

  const t = useCallback(
    (key: string, fallback?: string) => messages[key] ?? fallback ?? key,
    [messages],
  );

  return { t, locale };
}
