/**
 * Phase 3 — Point d'entrée unique pour mutations profiles (rôle / autorité / activation).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertImmutableRootPolicy,
  type ImmutableRootContext,
} from "@/lib/governance/runtime/root-protection";
import type { ProfileAuthoritySnapshot, RootMutationIntent } from "@/lib/governance/runtime/root-protection";

export type ProfileAuthorityMutationIntent = RootMutationIntent;

export async function guardProfileAuthorityMutation(
  admin: SupabaseClient,
  ctx: ImmutableRootContext,
  before: ProfileAuthoritySnapshot,
  intent: ProfileAuthorityMutationIntent,
): Promise<void> {
  await assertImmutableRootPolicy(admin, ctx, before, intent);
}
