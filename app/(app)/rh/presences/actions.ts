"use server";

import { redirect } from "next/navigation";
import { revalidateRH } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhWrite } from "@/lib/server/rh-access";
import { recordAttendance } from "@/lib/server/rh";
import type { AttendanceStatus } from "@/lib/types/rh";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function recordAttendanceAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  const result = await recordAttendance({
    employee_id: field(formData, "employee_id"),
    date: field(formData, "date") || new Date().toISOString().slice(0, 10),
    status: (field(formData, "status") || "present") as AttendanceStatus,
    arrival_time: field(formData, "arrival_time") || undefined,
    departure_time: field(formData, "departure_time") || undefined,
    notes: field(formData, "notes") || undefined,
    recorded_by: user.id,
  });

  if (!result.success) {
    redirect(`/rh/presences/new?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateRH();
  redirect(`/rh/presences?success=${encodeURIComponent("Présence enregistrée.")}`);
}
