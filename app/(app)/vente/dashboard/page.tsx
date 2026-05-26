import { redirect } from "next/navigation";

/** Legacy B2.3 — redirige vers le cockpit factorisé DeptHomePage. */
export default function VenteDashboardPage() {
  redirect("/dept/vente");
}
