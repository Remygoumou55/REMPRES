import { cookies, headers } from "next/headers";
import { normalizeLocale, type AppLocale } from "@/lib/i18n/config";

export function getRequestLocale(): AppLocale {
  const cookieLocale = cookies().get("erp_locale")?.value;
  if (cookieLocale) return normalizeLocale(cookieLocale);

  const acceptLanguage = headers().get("accept-language");
  const firstToken = String(acceptLanguage ?? "").split(",")[0]?.trim().split("-")[0];
  return normalizeLocale(firstToken);
}
