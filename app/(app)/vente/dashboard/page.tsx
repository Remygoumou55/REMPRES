import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Legacy B2.3 — redirige vers le cockpit factorisé DeptHomePage. */
export default function VenteDashboardPage() {
  redirect("/dept/vente");
}
