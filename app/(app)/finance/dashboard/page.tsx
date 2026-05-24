import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Legacy B3 — redirige vers le cockpit factorisé DeptHomePage. */
export default function FinanceDashboardPage() {
  redirect("/dept/finance");
}
