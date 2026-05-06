import { redirect } from "next/navigation";

/** Vue synthèse département vente — historique comme tableau de bord sans nouvelle UI. */
export default function VenteDashboardPage() {
  redirect("/vente/historique");
}
