/**
 * Bloc 3 Étape 8 — Plugin lifecycle (install / activate — gouverné).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { emitPlatformPluginInstalled } from "@/lib/erp-core/events/integrations/platform-events";

export async function activatePlatformPluginInstallation(params: {
  admin: SupabaseClient<Database>;
  actorUserId: string;
  installationId: string;
  pluginKey: string;
}): Promise<void> {
  const { error } = await params.admin
    .from("erp_platform_plugin_installations")
    .update({ status: "active" })
    .eq("id", params.installationId);

  if (error) throw new Error(error.message);

  await emitPlatformPluginInstalled({
    actorUserId: params.actorUserId,
    installationId: params.installationId,
    pluginKey: params.pluginKey,
  });
}
