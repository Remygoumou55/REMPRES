import { isPlatformGovernanceActor, toPlatformAuthorityProfile } from "@/lib/auth/authorization-core";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { countPendingApprovals } from "@/lib/server/approvals";

export type NotificationType = "approval" | "alert" | "info";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
};

/** Insère une notification in-app (non bloquant pour l'appelant). */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (!input.userId?.trim()) return;

  try {
    const adminClient = getSupabaseAdminClient();
    const dbType =
      input.type === "approval"
        ? "approval_required"
        : input.type === "alert"
          ? "approval_rejected"
          : "info";

    const { error } = await adminClient.from("notifications" as never).insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: dbType,
      link: input.actionUrl ?? null,
      read_at: null,
    } as never);

    if (error) {
      console.error("Notification insert failed:", error.message);
    }
  } catch (err) {
    console.error("Notification insert failed:", err);
  }
}

async function countUnreadGovernanceAlerts(): Promise<number> {
  try {
    const supabase = getSupabaseServerClient();
    const { count, error } = await supabase
      .from("governance_alerts")
      .select("id", { count: "exact", head: true })
      .eq("status", "unread");
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countUnreadUserNotifications(userId: string): Promise<number> {
  try {
    const supabase = getSupabaseServerClient();
    const { count, error } = await supabase
      .from("notifications" as never)
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Compteur initial pour le badge topbar (SSR). */
export async function getPendingCount(
  userId: string,
  role: string | null | undefined,
  systemAuthority?: string | null,
): Promise<number> {
  const profile = toPlatformAuthorityProfile({ roleKey: role, systemAuthority });

  if (isPlatformGovernanceActor(profile)) {
    const [pendingApprovals, unreadAlerts, unreadNotifs] = await Promise.all([
      countPendingApprovals().catch(() => 0),
      countUnreadGovernanceAlerts(),
      countUnreadUserNotifications(userId),
    ]);
    return pendingApprovals + unreadAlerts + unreadNotifs;
  }

  return countUnreadUserNotifications(userId);
}
