"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { revalidateMarketing } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { createApprovalRequest } from "@/lib/server/approvals";
import { createNotification } from "@/lib/server/notifications";
import {
  assertMarketingWrite,
  canMarketingDelete,
} from "@/lib/server/marketing-access";
import {
  convertLeadToClient,
  createLead,
  getLeadById,
  softDeleteLead,
  updateLead,
  updateLeadStatus,
} from "@/lib/server/marketing";
import { getModulePermissions } from "@/lib/server/permissions";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  LeadSource,
  LeadStatus,
} from "@/lib/types/marketing";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

async function notifyVenteResponsables(leadName: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  const { data: venteUsers } = await supabase
    .from("profiles")
    .select("id")
    .eq("role_key", "responsable_vente")
    .is("deleted_at", null);

  for (const u of venteUsers ?? []) {
    try {
      await createNotification({
        userId: String(u.id),
        type: "info",
        title: "Nouveau client converti",
        message: `Le lead marketing « ${leadName} » a été converti en client. Consultez /vente/clients.`,
        actionUrl: "/vente/clients",
      });
    } catch {
      /* non bloquant */
    }
  }
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

export async function convertLeadToClientAction(leadId: string): Promise<{
  success: boolean;
  clientId?: string;
  alreadyExists?: boolean;
  requiresApproval?: boolean;
  error?: string;
}> {
  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Non authentifié." };
  }

  const perms = await getModulePermissions(user.id, ["marketing"]);
  if (!perms.canRead) {
    return { success: false, error: "Accès refusé." };
  }

  const lead = await getLeadById(leadId);
  if (!lead) {
    return { success: false, error: "Lead introuvable." };
  }

  const leadName = `${lead.first_name} ${lead.last_name}`.trim();

  if (!perms.canUpdate && !perms.canCreate) {
    const profile = await getCachedProfileRow(user.id);
    const approval = await createApprovalRequest({
      requestedBy: user.id,
      requesterName: profile.displayName || user.email || user.id,
      requesterRole: profile.roleKey ?? "agent",
      requesterDept: profile.departmentKey ?? "MARKETING",
      actionType: "marketing.lead.convert_to_client",
      module: "marketing",
      targetId: leadId,
      targetLabel: leadName,
      description: `Conversion du lead « ${leadName} » en client.`,
      actionPayload: { leadId, leadName },
      priority: "normal",
    });

    if (!approval.success) {
      return {
        success: false,
        error: approval.error ?? "Impossible de créer la demande d'approbation.",
      };
    }

    return {
      success: false,
      requiresApproval: true,
      error:
        "Demande d'approbation envoyée — un responsable validera la conversion.",
    };
  }

  const result = await convertLeadToClient(leadId, user.id);

  if (result.success && result.clientId) {
    await notifyVenteResponsables(leadName);
    await revalidateMarketing();
    revalidatePath("/marketing/leads");
    revalidatePath("/marketing/campagnes");
    revalidatePath("/vente/clients");
    revalidatePath("/dept/marketing");
    revalidatePath("/dept/vente");
  }

  return result;
}

/** Conversion avec redirection (fiche lead détail). */
export async function convertLeadToClientRedirectAction(leadId: string) {
  const result = await convertLeadToClientAction(leadId);
  if (result.requiresApproval) {
    redirect(
      `/marketing/leads/${leadId}?success=${encodeURIComponent(result.error ?? "Demande envoyée.")}`,
    );
  }
  if (result.alreadyExists && result.clientId) {
    redirect(
      `/vente/clients/${result.clientId}?error=${encodeURIComponent(result.error ?? "Client existant.")}`,
    );
  }
  if (!result.success || !result.clientId) {
    redirect(
      `/marketing/leads/${leadId}?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
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
