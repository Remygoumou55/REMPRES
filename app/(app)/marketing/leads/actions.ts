"use server";

import { redirect } from "next/navigation";
import { revalidateMarketing } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertMarketingWrite,
  canMarketingDelete,
} from "@/lib/server/marketing-access";
import {
  convertLeadToClient,
  createLead,
  softDeleteLead,
  updateLead,
  updateLeadStatus,
} from "@/lib/server/marketing";
import type {
  LeadSource,
  LeadStatus,
} from "@/lib/types/marketing";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createLeadAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const result = await createLead({
    first_name: field(formData, "first_name"),
    last_name: field(formData, "last_name"),
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    company: field(formData, "company") || undefined,
    source: (field(formData, "source") || "autre") as LeadSource,
    campaign_id: field(formData, "campaign_id") || undefined,
    status: (field(formData, "status") || "new") as LeadStatus,
    estimated_value_gnf: Number(field(formData, "estimated_value_gnf")) || 0,
    notes: field(formData, "notes") || undefined,
    created_by: user.id,
  });

  if (!result.success || !result.id) {
    redirect(
      `/marketing/leads/new?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(`/marketing/leads?success=${encodeURIComponent("Lead enregistré.")}`);
}

export async function updateLeadAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const result = await updateLead(id, {
    first_name: field(formData, "first_name"),
    last_name: field(formData, "last_name"),
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    company: field(formData, "company") || undefined,
    source: (field(formData, "source") || "autre") as LeadSource,
    campaign_id: field(formData, "campaign_id") || undefined,
    status: (field(formData, "status") || "new") as LeadStatus,
    estimated_value_gnf: Number(field(formData, "estimated_value_gnf")) || 0,
    notes: field(formData, "notes") || undefined,
  });

  if (!result.success) {
    redirect(
      `/marketing/leads/${id}/edit?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(
    `/marketing/leads/${id}?success=${encodeURIComponent("Lead mis à jour.")}`,
  );
}

export async function updateLeadStatusAction(id: string, status: LeadStatus) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const result = await updateLeadStatus(id, status);
  if (!result.success) {
    redirect(
      `/marketing/leads/${id}?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(
    `/marketing/leads/${id}?success=${encodeURIComponent("Statut mis à jour.")}`,
  );
}

export async function convertLeadToClientAction(leadId: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const result = await convertLeadToClient(leadId, user.id);
  if (!result.success || !result.clientId) {
    redirect(
      `/marketing/leads/${leadId}?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(
    `/vente/clients/${result.clientId}?success=${encodeURIComponent("Lead converti en client.")}`,
  );
}

export async function deleteLeadAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canMarketingDelete(user.id))) redirect("/access-denied");

  const result = await softDeleteLead(id);
  if (!result.success) {
    redirect(
      `/marketing/leads?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(`/marketing/leads?success=${encodeURIComponent("Lead supprimé.")}`);
}
