import { permanentRedirect } from "next/navigation";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";

/** Alias legacy — route officielle : /settings/permissions */
export default function ConfigLegacyRedirect() {
  permanentRedirect(SETTINGS_OFFICIAL_ROUTES.permissions);
}
