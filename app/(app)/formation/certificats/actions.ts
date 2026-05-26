"use server";

import { redirect } from "next/navigation";
import { revalidateFormation } from "@/lib/cache/revalidation-map";
import { assertFormationRead, assertFormationWrite } from "@/lib/server/formation-access";
import { getCertificateDataById, issueCertificate } from "@/lib/server/formation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import type {
  CertificateData,
  TraineeData,
  TrainingData,
} from "@/components/formation/CertificatePDF";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export type GetCertificateDataResult = {
  success: boolean;
  certificate?: CertificateData;
  trainee?: TraineeData;
  training?: TrainingData;
  error?: string;
};

export async function getCertificateDataAction(
  certificateId: string,
): Promise<GetCertificateDataResult> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };
  await assertFormationRead(user.id);

  const payload = await getCertificateDataById(certificateId);
  if (!payload) return { success: false, error: "Certificat introuvable." };

  return {
    success: true,
    certificate: payload.certificate,
    trainee: payload.trainee,
    training: payload.training,
  };
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
  const successMsg = encodeURIComponent(`Certificat N°${result.certNumber ?? ""} émis avec succès !`);
  const issuedId = result.id ? `&issuedId=${result.id}` : "";
  redirect(`/formation/certificats?success=${successMsg}${issuedId}`);
}
