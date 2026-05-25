"use server";

import { redirect } from "next/navigation";
import { revalidateMarketing } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertMarketingWrite,
  canMarketingDelete,
} from "@/lib/server/marketing-access";
import {
  createCampaign,
  softDeleteCampaign,
  updateCampaign,
  updateCampaignStatus,
} from "@/lib/server/marketing";
import type {
  CampaignStatus,
  CampaignType,
} from "@/lib/types/marketing";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createCampaignAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const result = await createCampaign({
    title: field(formData, "title"),
    description: field(formData, "description") || undefined,
    type: (field(formData, "type") || "autre") as CampaignType,
    status: (field(formData, "status") || "draft") as CampaignStatus,
    start_date: field(formData, "start_date") || undefined,
    end_date: field(formData, "end_date") || undefined,
    budget_gnf: Number(field(formData, "budget_gnf")) || 0,
    target_audience: field(formData, "target_audience") || undefined,
    goal: field(formData, "goal") || undefined,
    channel: field(formData, "channel") || undefined,
    created_by: user.id,
  });

  if (!result.success || !result.id) {
    redirect(
      `/marketing/campagnes/new?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(`/marketing/campagnes?success=${encodeURIComponent("Campagne créée.")}`);
}

export async function updateCampaignAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const result = await updateCampaign(id, {
    title: field(formData, "title"),
    description: field(formData, "description") || undefined,
    type: (field(formData, "type") || "autre") as CampaignType,
    status: (field(formData, "status") || "draft") as CampaignStatus,
    start_date: field(formData, "start_date") || undefined,
    end_date: field(formData, "end_date") || undefined,
    budget_gnf: Number(field(formData, "budget_gnf")) || 0,
    target_audience: field(formData, "target_audience") || undefined,
    goal: field(formData, "goal") || undefined,
    channel: field(formData, "channel") || undefined,
  });

  if (!result.success) {
    redirect(
      `/marketing/campagnes/${id}/edit?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(
    `/marketing/campagnes/${id}?success=${encodeURIComponent("Campagne mise à jour.")}`,
  );
}

export async function updateCampaignStatusAction(
  id: string,
  status: CampaignStatus,
) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertMarketingWrite(user.id);

  const result = await updateCampaignStatus(id, status);
  if (!result.success) {
    redirect(
      `/marketing/campagnes?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(
    `/marketing/campagnes?success=${encodeURIComponent("Statut mis à jour.")}`,
  );
}

export async function deleteCampaignAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canMarketingDelete(user.id))) redirect("/access-denied");

  const result = await softDeleteCampaign(id);
  if (!result.success) {
    redirect(
      `/marketing/campagnes?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateMarketing();
  redirect(
    `/marketing/campagnes?success=${encodeURIComponent("Campagne supprimée.")}`,
  );
}
