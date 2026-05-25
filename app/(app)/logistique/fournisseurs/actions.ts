"use server";

import { redirect } from "next/navigation";
import { revalidateLogistique } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueWrite } from "@/lib/server/logistique-access";
import {
  createSupplier,
  setSupplierActive,
  updateSupplier,
} from "@/lib/server/logistique";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

function boolField(formData: FormData, name: string): boolean {
  const v = formData.get(name);
  if (typeof v === "string") return v === "on" || v === "true" || v === "1";
  return false;
}

export async function createSupplierAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const result = await createSupplier({
    name: field(formData, "name"),
    contact_name: field(formData, "contact_name") || undefined,
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    address: field(formData, "address") || undefined,
    category: field(formData, "category") || undefined,
    is_active: boolField(formData, "is_active"),
  });

  if (!result.success) {
    redirect(
      `/logistique/fournisseurs/new?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateLogistique();
  redirect(
    `/logistique/fournisseurs?success=${encodeURIComponent("Fournisseur créé.")}`,
  );
}

export async function updateSupplierAction(id: string, formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const result = await updateSupplier(id, {
    name: field(formData, "name"),
    contact_name: field(formData, "contact_name") || undefined,
    email: field(formData, "email") || undefined,
    phone: field(formData, "phone") || undefined,
    address: field(formData, "address") || undefined,
    category: field(formData, "category") || undefined,
    is_active: boolField(formData, "is_active"),
  });

  if (!result.success) {
    redirect(
      `/logistique/fournisseurs/${id}/edit?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateLogistique();
  redirect(
    `/logistique/fournisseurs/${id}?success=${encodeURIComponent("Fournisseur mis à jour.")}`,
  );
}

export async function toggleSupplierStatusAction(id: string, isActive: boolean) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueWrite(user.id);

  const result = await setSupplierActive(id, isActive);
  if (!result.success) {
    redirect(
      `/logistique/fournisseurs?error=${encodeURIComponent(result.error ?? "Erreur")}`,
    );
  }
  await revalidateLogistique();
  redirect(
    `/logistique/fournisseurs?success=${encodeURIComponent(
      isActive ? "Fournisseur réactivé." : "Fournisseur désactivé.",
    )}`,
  );
}
