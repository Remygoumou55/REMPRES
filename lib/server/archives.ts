import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole, isSuperAdmin } from "@/lib/server/permissions";

export type ArchiveDept =
  | "globales"
  | "vente"
  | "finance"
  | "rh"
  | "formation"
  | "consultation"
  | "marketing"
  | "logistique";

export const ARCHIVE_DEPT_KEYS = [
  "vente",
  "finance",
  "rh",
  "formation",
  "consultation",
  "marketing",
  "logistique",
] as const;

export type ArchiveDeptKey = (typeof ARCHIVE_DEPT_KEYS)[number];

export const ARCHIVE_DEPT_LABELS: Record<ArchiveDept, string> = {
  globales: "Globales",
  vente: "Vente",
  finance: "Finance",
  rh: "RH",
  formation: "Formation",
  consultation: "Consultation",
  marketing: "Marketing",
  logistique: "Logistique",
};

export interface ArchiveKpi {
  label: string;
  count: number;
  icon: string;
  color: "blue" | "red" | "purple" | "orange" | "green";
}

export interface ArchiveTableRow {
  id: string;
  name: string;
  meta1: string;
  meta2: string;
  deletedAt: string;
  status: "Supprimé" | "Annulé" | "Archivé";
  badge: "del" | "ann" | "arc";
}

export interface ArchiveTable {
  title: string;
  icon: string;
  iconColor: string;
  count: number;
  columns: [string, string, string];
  rows: ArchiveTableRow[];
}

export interface ArchiveActivity {
  id: string;
  action: string;
  label: string;
  module: string;
  timeAgo: string;
  type: "del" | "ann" | "arc";
}

export interface ArchivePageData {
  dept: ArchiveDept;
  kpis: ArchiveKpi[];
  tables: ArchiveTable[];
  recentActivity: ArchiveActivity[];
}

export type ArchiveGlobalesDeptCard = {
  key: ArchiveDeptKey;
  label: string;
  icon: string;
  borderColor: string;
  iconColor: string;
  count: number;
  href: string;
};

export async function assertArchivesAccess(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  if (await isAdminRole(userId)) return;
  redirect("/access-denied");
}

export async function assertSuperAdminArchivesAdmin(userId: string): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  redirect("/access-denied");
}

function fmtDate(d: string | null): string {
  return d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function buildActivity(
  items: Array<ArchiveTableRow & { module: string; type: "del" | "ann" | "arc" }>,
): ArchiveActivity[] {
  const verbMap = {
    del: "Suppression de",
    ann: "Annulation de",
    arc: "Archivage de",
  };

  return items
    .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime())
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      action: verbMap[item.type],
      label: item.name,
      module: item.module,
      timeAgo: formatTimeAgo(item.deletedAt),
      type: item.type,
    }));
}

export async function getArchiveGlobalesSummary(): Promise<ArchiveGlobalesDeptCard[]> {
  const supabase = getSupabaseServerClient();

  const [clients, sales, products, expenses] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
    supabase.from("sales").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
    supabase.from("products").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
    supabase.from("expenses").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
  ]);

  const venteCount = (clients.count ?? 0) + (sales.count ?? 0) + (products.count ?? 0);

  return [
    {
      key: "vente",
      label: "Vente",
      icon: "ShoppingCart",
      borderColor: "#2D7CC4",
      iconColor: "#2D7CC4",
      count: venteCount,
      href: "/archives/vente",
    },
    {
      key: "finance",
      label: "Finance",
      icon: "BarChart3",
      borderColor: "#F59E0B",
      iconColor: "#F59E0B",
      count: expenses.count ?? 0,
      href: "/archives/finance",
    },
    {
      key: "rh",
      label: "RH",
      icon: "Users",
      borderColor: "#10B981",
      iconColor: "#10B981",
      count: 0,
      href: "/archives/rh",
    },
    {
      key: "formation",
      label: "Formation",
      icon: "GraduationCap",
      borderColor: "#8B5CF6",
      iconColor: "#8B5CF6",
      count: 0,
      href: "/archives/formation",
    },
    {
      key: "consultation",
      label: "Consultation",
      icon: "Briefcase",
      borderColor: "#6366F1",
      iconColor: "#6366F1",
      count: 0,
      href: "/archives/consultation",
    },
    {
      key: "marketing",
      label: "Marketing",
      icon: "Megaphone",
      borderColor: "#EC4899",
      iconColor: "#EC4899",
      count: 0,
      href: "/archives/marketing",
    },
    {
      key: "logistique",
      label: "Logistique",
      icon: "Package",
      borderColor: "#14B8A6",
      iconColor: "#14B8A6",
      count: 0,
      href: "/archives/logistique",
    },
  ];
}

export async function getArchiveData(dept: ArchiveDeptKey): Promise<ArchivePageData> {
  const supabase = getSupabaseServerClient();

  switch (dept) {
    case "vente": {
      const [clientCount, saleCount, productCount, clients, sales, products] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
        supabase.from("sales").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
        supabase.from("products").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
        supabase
          .from("clients")
          .select("id, first_name, last_name, company_name, city, deleted_at")
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
          .limit(20),
        supabase
          .from("sales")
          .select("id, reference, total_amount_gnf, created_at, deleted_at")
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
          .limit(20),
        supabase
          .from("products")
          .select("id, name, sku, deleted_at")
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
          .limit(20),
      ]);

      const clientRows: ArchiveTableRow[] = (clients.data ?? []).map((c) => ({
        id: c.id,
        name: c.company_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Client",
        meta1: c.city ?? "—",
        meta2: fmtDate(c.deleted_at),
        deletedAt: c.deleted_at ?? "",
        status: "Supprimé",
        badge: "del",
      }));

      const saleRows: ArchiveTableRow[] = (sales.data ?? []).map((s) => ({
        id: s.id,
        name: s.reference ?? s.id.slice(0, 8),
        meta1: `${Number(s.total_amount_gnf).toLocaleString("fr-FR")} GNF`,
        meta2: fmtDate(s.deleted_at),
        deletedAt: s.deleted_at ?? "",
        status: "Annulé",
        badge: "ann",
      }));

      const productRows: ArchiveTableRow[] = (products.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        meta1: p.sku ?? "—",
        meta2: fmtDate(p.deleted_at),
        deletedAt: p.deleted_at ?? "",
        status: "Archivé",
        badge: "arc",
      }));

      return {
        dept: "vente",
        kpis: [
          { label: "Clients supprimés", count: clientCount.count ?? 0, icon: "Users", color: "blue" },
          { label: "Ventes annulées", count: saleCount.count ?? 0, icon: "ShoppingCart", color: "red" },
          { label: "Produits archivés", count: productCount.count ?? 0, icon: "Package", color: "purple" },
        ],
        tables: [
          {
            title: "Clients supprimés",
            icon: "Users",
            iconColor: "#2D7CC4",
            count: clientRows.length,
            columns: ["Nom", "Ville", "Supprimé le"],
            rows: clientRows,
          },
          {
            title: "Ventes annulées",
            icon: "ShoppingCart",
            iconColor: "#EF4444",
            count: saleRows.length,
            columns: ["Référence", "Montant", "Annulée le"],
            rows: saleRows,
          },
          {
            title: "Produits archivés",
            icon: "Package",
            iconColor: "#8B5CF6",
            count: productRows.length,
            columns: ["Nom", "SKU", "Archivé le"],
            rows: productRows,
          },
        ],
        recentActivity: buildActivity([
          ...clientRows.slice(0, 2).map((r) => ({ ...r, module: "Clients", type: "del" as const })),
          ...saleRows.slice(0, 2).map((r) => ({ ...r, module: "Ventes", type: "ann" as const })),
          ...productRows.slice(0, 2).map((r) => ({ ...r, module: "Produits", type: "arc" as const })),
        ]),
      };
    }

    case "finance": {
      const [expenseCount, expenses] = await Promise.all([
        supabase.from("expenses").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
        supabase
          .from("expenses")
          .select("id, description, amount_gnf, deleted_at")
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
          .limit(20),
      ]);

      const rows: ArchiveTableRow[] = (expenses.data ?? []).map((e) => ({
        id: e.id,
        name: e.description,
        meta1: `${Number(e.amount_gnf).toLocaleString("fr-FR")} GNF`,
        meta2: fmtDate(e.deleted_at),
        deletedAt: e.deleted_at ?? "",
        status: "Archivé",
        badge: "arc",
      }));

      return {
        dept: "finance",
        kpis: [
          {
            label: "Dépenses archivées",
            count: expenseCount.count ?? 0,
            icon: "Receipt",
            color: "orange",
          },
        ],
        tables: [
          {
            title: "Dépenses archivées",
            icon: "Receipt",
            iconColor: "#F59E0B",
            count: rows.length,
            columns: ["Description", "Montant", "Archivée le"],
            rows,
          },
        ],
        recentActivity: buildActivity(rows.slice(0, 4).map((r) => ({ ...r, module: "Finance", type: "arc" as const }))),
      };
    }

    default:
      return {
        dept,
        kpis: [],
        tables: [],
        recentActivity: [],
      };
  }
}

export type DeletionLogRow = {
  id: string;
  module: string;
  element: string;
  deletedBy: string;
  deletedAt: string;
};

export async function listDeletionActivityLogs(limit = 100): Promise<DeletionLogRow[]> {
  const supabase = getSupabaseServerClient();

  const { data: logs } = await supabase
    .from("activity_logs")
    .select("id, module_key, action_key, target_table, target_id, actor_user_id, metadata, created_at")
    .eq("action_key", "delete")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!logs?.length) return [];

  const actorIds = Array.from(new Set(logs.map((l) => l.actor_user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", actorIds);

  const nameById = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || p.id.slice(0, 8),
    ]),
  );

  return logs.map((log) => {
    const metadata =
      log.metadata && typeof log.metadata === "object" ? (log.metadata as Record<string, unknown>) : {};
    const label =
      (typeof metadata.label === "string" && metadata.label) ||
      (typeof metadata.entity_id === "string" && metadata.entity_id) ||
      log.target_id ||
      "—";

    return {
      id: log.id,
      module: log.module_key,
      element: String(label),
      deletedBy: nameById.get(log.actor_user_id) ?? log.actor_user_id.slice(0, 8),
      deletedAt: new Date(log.created_at).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });
}
