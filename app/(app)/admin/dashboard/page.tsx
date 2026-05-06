import { redirect } from "next/navigation";

/** Hub supervision — même contenu KPI que `/dashboard` sans dupliquer la page. */
export default function AdminDashboardPage() {
  redirect("/dashboard");
}
