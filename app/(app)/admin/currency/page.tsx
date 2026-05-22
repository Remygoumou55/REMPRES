import { permanentRedirect } from "next/navigation";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";

/** Alias legacy — route officielle : /settings/rates */
export default function AdminCurrencyLegacyRedirect() {
  permanentRedirect(SETTINGS_OFFICIAL_ROUTES.rates);
}
