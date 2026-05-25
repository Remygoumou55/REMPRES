"use server";

import { redirect } from "next/navigation";
import { revalidateConsultation } from "@/lib/cache/revalidation-map";
import { assertConsultationWrite } from "@/lib/server/consultation-access";
import { createAppointment, softDeleteAppointment, updateAppointment } from "@/lib/server/consultation";
import { getServerSessionUser } from "@/lib/server/auth-session";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createAppointmentAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);

  const result = await createAppointment({
    title: field(formData, "title"),
    appointment_date: field(formData, "appointment_date"),
    start_time: field(formData, "start_time") || undefined,
    end_time: field(formData, "end_time") || undefined,
    location: field(formData, "location") || undefined,
    client_name: field(formData, "client_name") || undefined,
    mission_id: field(formData, "mission_id") || undefined,
    description: field(formData, "description") || undefined,
    notes: field(formData, "notes") || undefined,
    created_by: user.id,
  });

  if (!result.success) {
    redirect(`/consultation/agenda/new?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateConsultation();
  redirect(`/consultation/agenda?success=${encodeURIComponent("Rendez-vous créé.")}`);
}

export async function updateAppointmentAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);

  await updateAppointment(id, {
    title: field(formData, "title"),
    appointment_date: field(formData, "appointment_date"),
    start_time: field(formData, "start_time") || undefined,
    end_time: field(formData, "end_time") || undefined,
    status: field(formData, "status") || undefined,
  });
  await revalidateConsultation();
  redirect(`/consultation/agenda?success=${encodeURIComponent("Rendez-vous mis à jour.")}`);
}

export async function softDeleteAppointmentAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationWrite(user.id);
  await softDeleteAppointment(id);
  await revalidateConsultation();
  redirect(`/consultation/agenda?success=${encodeURIComponent("Rendez-vous supprimé.")}`);
}
