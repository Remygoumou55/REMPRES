"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function revalidateProfilSurfaces(): void {
  revalidatePath("/profil");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

function trimOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function updateProfileAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const fullName = trimOrNull(formData.get("full_name"));

  let firstName: string | null = null;
  let lastName: string | null = null;
  if (fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      firstName = parts[0]!;
    } else if (parts.length >= 2) {
      firstName = parts[0]!;
      lastName = parts.slice(1).join(" ");
    }
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
    })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateProfilSurfaces();
  return { success: true };
}

export async function uploadAvatarAction(
  formData: FormData,
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Aucun fichier reçu" };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { success: false, error: "Fichier trop volumineux (max 2 Mo)" };
  }
  const mime = file.type.toLowerCase();
  if (!ALLOWED_AVATAR_MIME.has(mime)) {
    return {
      success: false,
      error: "Format non supporté (JPG, PNG ou WebP uniquement)",
    };
  }

  const ext =
    MIME_EXT[mime] ?? (file.name.split(".").pop() ?? "png").toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const admin = getSupabaseAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: publicUrlData } = admin.storage
    .from("avatars")
    .getPublicUrl(path);
  const publicUrl = publicUrlData.publicUrl;

  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidateProfilSurfaces();
  return { success: true, avatarUrl: publicUrl };
}

export async function removeAvatarAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateProfilSurfaces();
  return { success: true };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const newPassword = trimOrNull(formData.get("new_password"));
  const confirm = trimOrNull(formData.get("confirm_password"));

  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: "Le mot de passe doit contenir au moins 8 caractères.",
    };
  }
  if (newPassword !== confirm) {
    return { success: false, error: "Les deux mots de passe ne correspondent pas." };
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (error) return { success: false, error: error.message };

  return { success: true };
}
