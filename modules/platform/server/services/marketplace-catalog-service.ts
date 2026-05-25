import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { emitPlatformMarketplaceListingPublished } from "@/lib/erp-core/events/integrations/platform-events";
import { listListedCatalogPlugins } from "@/modules/platform/server/repositories/catalog-plugins-repository";

export async function publishMarketplaceListing(params: {
  supabase: SupabaseClient<Database>;
  actorUserId: string;
  pluginKey: string;
}): Promise<void> {
  const { error } = await params.supabase
    .from("erp_platform_catalog_plugins")
    .update({ is_listed: true })
    .eq("plugin_key", params.pluginKey);

  if (error) throw new Error(error.message);

  await emitPlatformMarketplaceListingPublished({
    actorUserId: params.actorUserId,
    pluginKey: params.pluginKey,
  });
}

export async function getMarketplaceCatalogSummary(supabase: SupabaseClient<Database>) {
  const plugins = await listListedCatalogPlugins(supabase, 200);
  return {
    total: plugins.length,
    listed: plugins.length,
    byKind: plugins.reduce(
      (acc, p) => {
        acc[p.kind] = (acc[p.kind] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
  };
}
