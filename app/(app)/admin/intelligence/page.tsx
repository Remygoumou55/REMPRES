import { redirect } from "next/navigation";

/**
 * Ancienne entrée « intelligence » : le périmètre « Activité système » du module Actions
 * est désormais porté par le pilotage plateforme (`/admin/platform-dashboard`).
 */
export default function AdminIntelligenceRedirectPage() {
  redirect("/admin/platform-dashboard");
}
