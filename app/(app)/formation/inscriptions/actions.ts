"use server";

import { redirect } from "next/navigation";
import { revalidateFormation } from "@/lib/cache/revalidation-map";
import { assertFormationWrite } from "@/lib/server/formation-access";
import { createEnrollment, updateEnrollmentStatus } from "@/lib/server/formation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import type { EnrollmentStatus, PaymentMethod } from "@/lib/types/formation";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createEnrollmentAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  const result = await createEnrollment({
    training_id: field(formData, "training_id"),
    trainee_id: field(formData, "trainee_id"),
    status: (field(formData, "status") || "pending") as EnrollmentStatus,
    amount_paid_gnf: Number(field(formData, "amount_paid_gnf")) || 0,
    payment_method: (field(formData, "payment_method") || undefined) as PaymentMethod | undefined,
  });

  if (!result.success) {
    redirect(`/formation/inscriptions?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateFormation();
  redirect(`/formation/inscriptions?success=${encodeURIComponent("Inscription créée.")}`);
}

export async function updateEnrollmentStatusAction(id: string, status: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);
  await updateEnrollmentStatus(id, status);
  await revalidateFormation();
  redirect(`/formation/inscriptions?success=${encodeURIComponent("Statut mis à jour.")}`);
}
