import { permanentRedirect } from "next/navigation";
import { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";

/** Alias legacy — route officielle : /settings/users */
export default function AdminUsersLegacyRedirect() {
  permanentRedirect(SETTINGS_OFFICIAL_ROUTES.users);
}
