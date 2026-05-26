import { redirect } from "next/navigation";

/** Legacy B3 — redirige vers le cockpit factorisé DeptHomePage. */
export default function FinanceDashboardPage() {
  redirect("/dept/finance");
}
