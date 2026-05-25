"use server";

import { redirect } from "next/navigation";
import { revalidateFormation } from "@/lib/cache/revalidation-map";
import { assertFormationWrite } from "@/lib/server/formation-access";
import { issueCertificate } from "@/lib/server/formation";
import { getServerSessionUser } from "@/lib/server/auth-session";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function issueCertificateAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertFormationWrite(user.id);

  const result = await issueCertificate({
    training_id: field(formData, "training_id"),
    trainee_id: field(formData, "trainee_id"),
    score: Number(field(formData, "score")) || undefined,
    grade: field(formData, "grade") || undefined,
    valid_until: field(formData, "valid_until") || undefined,
    notes: field(formData, "notes") || undefined,
  });

  if (!result.success) {
    redirect(`/formation/certificats?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateFormation();
  redirect(
    `/formation/certificats?success=${encodeURIComponent(`Certificat ${result.certNumber ?? ""} émis.`)}`,
  );
}
