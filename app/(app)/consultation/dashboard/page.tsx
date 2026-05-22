import { redirect } from "next/navigation";
import { DEPARTMENT_NAVIGATION, DEPARTMENT_KEYS } from "@/lib/departments/department-config";

/** Consultation absorbée par Formation (M1.5) — cockpit canonique Formation. */
export default function ConsultationDashboardPage() {
  redirect(DEPARTMENT_NAVIGATION[DEPARTMENT_KEYS.FORMATION].dashboardRoute);
}
