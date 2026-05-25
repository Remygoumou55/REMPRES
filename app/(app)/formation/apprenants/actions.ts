"use server";

import { redirect } from "next/navigation";
import { revalidateFormation } from "@/lib/cache/revalidation-map";
import { assertFormationWrite } from "@/lib/server/formation-access";
import { createTrainee, softDeleteTrainee, updateTrainee } from "@/lib/server/formation";
import { getServerSessionUser } from "@/lib/server/auth-session";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createTraineeAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  const result = await createTrainee({
    first_name: field(formData, "first_name"),
    last_name: field(formData, "last_name"),
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    company: field(formData, "company") || undefined,
    function: field(formData, "trainee_function") || undefined,
    notes: field(formData, "notes") || undefined,
    created_by: user.id,
  });

  if (!result.success) {
    redirect(`/formation/apprenants/new?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateFormation();
  redirect(`/formation/apprenants?success=${encodeURIComponent("Apprenant ajouté.")}`);
}

export async function updateTraineeAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  await updateTrainee(id, {
    first_name: field(formData, "first_name"),
    last_name: field(formData, "last_name"),
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    company: field(formData, "company") || undefined,
    function: field(formData, "trainee_function") || undefined,
    notes: field(formData, "notes") || undefined,
  });
  await revalidateFormation();
  redirect(`/formation/apprenants?success=${encodeURIComponent("Apprenant mis à jour.")}`);
}

export async function softDeleteTraineeAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);
  await softDeleteTrainee(id);
  await revalidateFormation();
  redirect(`/formation/apprenants?success=${encodeURIComponent("Apprenant supprimé.")}`);
}
