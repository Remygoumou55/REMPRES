import { unstable_cache } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { ANALYTICS_CACHE_TAGS } from "@/modules/analytics/constants/cache-tags";
import { RH_FOUNDATION_NEXT_CACHE_SEC } from "@/modules/analytics/constants";
import { buildRhTimeline, type RhTimelineInputItem } from "@/lib/rh/timeline";
import { computeRhReportingSummary, type RhReportingSummary } from "@/lib/rh/reporting";

type RhRecentEmployee = {
  id: string;
  fullName: string;
  email: string;
  roleKey: string;
  departmentKey: string | null;
  createdAt: string;
  isActive: boolean;
};

type RhRecentActivity = {
  id: string;
  moduleKey: string;
  actionKey: string;
  createdAt: string;
};

export type RhFoundationData = {
  activeEmployees: number;
  inactiveEmployees: number;
  activeRhTeam: number;
  newHires30d: number;
  pendingRhApprovals: number;
  unreadRhAlerts: number;
  recentEmployees: RhRecentEmployee[];
  recentRhActivity: RhRecentActivity[];
  timeline: RhTimelineInputItem[];
  reporting: RhReportingSummary;
  generatedAt: string;
};

async function safeCount(promise: PromiseLike<{ count: number | null }>): Promise<number> {
  try {
    const result = await promise;
    return result.count ?? 0;
  } catch {
    return 0;
  }
}

async function safeData<T>(promise: PromiseLike<{ data: T | null }>, fallback: T): Promise<T> {
  try {
    const result = await promise;
    return result.data ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeName(firstName: string | null, lastName: string | null, email: string | null): string {
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (email) return email;
  return "Compte";
}

async function computeRhFoundationDataUncached(): Promise<RhFoundationData> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    activeEmployees,
    inactiveEmployees,
    activeRhTeam,
    newHires30d,
    pendingRhApprovals,
    unreadRhAlerts,
    recentProfiles,
    recentRhActivity,
    recentLeaves,
    recentAttendance,
    approvalSamples,
  ] = await Promise.all([
    safeCount(
      supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .is("deleted_at", null)
        .neq("role_key", "super_admin"),
    ),
    safeCount(
      supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .is("deleted_at", null)
        .eq("is_active", false)
        .neq("role_key", "super_admin"),
    ),
    safeCount(
      supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .is("deleted_at", null)
        .eq("is_active", true)
        .eq("department_key", "RH"),
    ),
    safeCount(
      supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .is("deleted_at", null)
        .neq("role_key", "super_admin")
        .gte("created_at", thirtyDaysAgo),
    ),
    safeCount(
      supabase
        .from("approval_requests")
        .select("id", { head: true, count: "exact" })
        .eq("department_key", "rh")
        .eq("status", "pending"),
    ),
    safeCount(
      supabase
        .from("governance_alerts")
        .select("id", { head: true, count: "exact" })
        .eq("department_key", "rh")
        .eq("status", "unread"),
    ),
    safeData(
      supabase
        .from("profiles")
        .select("id,first_name,last_name,email,role_key,department_key,created_at,is_active")
        .is("deleted_at", null)
        .neq("role_key", "super_admin")
        .order("created_at", { ascending: false })
        .limit(8),
      [] as {
        id: string;
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        role_key: string;
        department_key: string | null;
        created_at: string;
        is_active: boolean;
      }[],
    ),
    safeData(
      supabase
        .from("activity_logs")
        .select("id,module_key,action_key,created_at")
        .in("module_key", ["rh", "profiles", "users"])
        .order("created_at", { ascending: false })
        .limit(8),
      [] as { id: string; module_key: string; action_key: string; created_at: string }[],
    ),
    safeData(
      supabase
        .from("rh_leave_requests")
        .select("id,status,leave_type,created_at")
        .order("created_at", { ascending: false })
        .limit(6),
      [] as { id: string; status: string; leave_type: string; created_at: string }[],
    ),
    safeData(
      supabase
        .from("rh_attendance_events")
        .select("id,event_type,event_at")
        .order("event_at", { ascending: false })
        .limit(6),
      [] as { id: string; event_type: string; event_at: string }[],
    ),
    safeData(
      supabase
        .from("approval_requests")
        .select("requested_at,approved_at,status")
        .eq("department_key", "rh")
        .eq("entity_type", "leave_request")
        .order("requested_at", { ascending: false })
        .limit(200),
      [] as { requested_at: string; approved_at: string | null; status: "pending" | "approved" | "rejected" | "expired" }[],
    ),
  ]);

  return {
    activeEmployees,
    inactiveEmployees,
    activeRhTeam,
    newHires30d,
    pendingRhApprovals,
    unreadRhAlerts,
    recentEmployees: recentProfiles.map((profile) => ({
      id: profile.id,
      fullName: normalizeName(profile.first_name, profile.last_name, profile.email),
      email: profile.email ?? "—",
      roleKey: profile.role_key,
      departmentKey: profile.department_key,
      createdAt: profile.created_at,
      isActive: profile.is_active,
    })),
    recentRhActivity: recentRhActivity.map((entry) => ({
      id: entry.id,
      moduleKey: entry.module_key,
      actionKey: entry.action_key,
      createdAt: entry.created_at,
    })),
    timeline: buildRhTimeline([
      ...recentRhActivity.map((entry) => ({
        id: `activity-${entry.id}`,
        source: "activity" as const,
        label: `${entry.module_key}:${entry.action_key}`,
        createdAt: entry.created_at,
      })),
      ...recentLeaves.map((leave) => ({
        id: `leave-${leave.id}`,
        source: "leave" as const,
        label: `leave_${leave.leave_type}_${leave.status}`,
        createdAt: leave.created_at,
      })),
      ...recentAttendance.map((attendance) => ({
        id: `attendance-${attendance.id}`,
        source: "attendance" as const,
        label: `attendance_${attendance.event_type}`,
        createdAt: attendance.event_at,
      })),
    ]),
    reporting: computeRhReportingSummary(
      approvalSamples.map((sample) => ({
        requestedAt: sample.requested_at,
        approvedAt: sample.approved_at,
        status: sample.status,
      })),
      now,
    ),
    generatedAt: now.toISOString(),
  };
}

export async function getRhFoundationData(viewerUserId: string): Promise<RhFoundationData> {
  const uid = String(viewerUserId ?? "").trim();
  if (!uid) {
    throw new Error("getRhFoundationData: viewerUserId is required");
  }

  return unstable_cache(
    async () => computeRhFoundationDataUncached(),
    ["analytics", "rh", "foundation", uid],
    {
      revalidate: RH_FOUNDATION_NEXT_CACHE_SEC,
      tags: [ANALYTICS_CACHE_TAGS.rhFoundation],
    },
  )();
}

