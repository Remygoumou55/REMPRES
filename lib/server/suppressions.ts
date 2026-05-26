import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type DeletedRecord = {
  id: string;
  label: string;
  deleted_at: string;
  table: string;
  module: string;
  extra?: string;
};

export type SuppressionsData = {
  clients: DeletedRecord[];
  products: DeletedRecord[];
  employees: DeletedRecord[];
  trainings: DeletedRecord[];
  missions: DeletedRecord[];
  campaigns: DeletedRecord[];
  leads: DeletedRecord[];
  total: number;
};

type SoftRow = Record<string, unknown> & { id: string; deleted_at: string };

function asRows(result: { data: unknown[] | null; error: unknown }): SoftRow[] {
  if (result.error || !Array.isArray(result.data)) return [];
  return result.data as SoftRow[];
}

function s(value: unknown): string {
  return value == null ? "" : String(value).trim();
}

function buildName(first: unknown, last: unknown, fallback: string): string {
  const full = `${s(first)} ${s(last)}`.trim();
  return full.length > 0 ? full : fallback;
}

function buildClientLabel(row: SoftRow): string {
  const company = s(row["company_name"]);
  if (company) return company;
  const name = buildName(row["first_name"], row["last_name"], "");
  if (name) return name;
  const email = s(row["email"]);
  return email || "Client";
}

/**
 * Global recycle bin — fetch soft-deleted records across every domain
 * table the Super Admin can restore or permanently delete.
 * All queries run in parallel via Promise.all().
 */
export async function getAllDeletedRecords(): Promise<SuppressionsData> {
  const supabase = getSupabaseServerClient();

  const [
    clientsRes,
    productsRes,
    employeesRes,
    trainingsRes,
    missionsRes,
    campaignsRes,
    leadsRes,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id, first_name, last_name, company_name, email, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    supabase
      .from("products")
      .select("id, name, sku, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    supabase
      .from("employees" as never)
      .select("id, first_name, last_name, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    supabase
      .from("trainings" as never)
      .select("id, title, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    supabase
      .from("missions" as never)
      .select("id, title, reference, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    supabase
      .from("campaigns" as never)
      .select("id, title, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
    supabase
      .from("leads" as never)
      .select("id, first_name, last_name, company, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(50),
  ]);

  const clients: DeletedRecord[] = asRows(clientsRes).map((r) => ({
    id: String(r.id),
    label: buildClientLabel(r),
    deleted_at: String(r.deleted_at),
    table: "clients",
    module: "vente",
    extra: s(r["email"]) || undefined,
  }));

  const products: DeletedRecord[] = asRows(productsRes).map((r) => ({
    id: String(r.id),
    label: s(r["name"]) || "Produit",
    deleted_at: String(r.deleted_at),
    table: "products",
    module: "vente",
    extra: s(r["sku"]) || undefined,
  }));

  const employees: DeletedRecord[] = asRows(employeesRes).map((r) => ({
    id: String(r.id),
    label: buildName(r["first_name"], r["last_name"], "Collaborateur"),
    deleted_at: String(r.deleted_at),
    table: "employees",
    module: "rh",
  }));

  const trainings: DeletedRecord[] = asRows(trainingsRes).map((r) => ({
    id: String(r.id),
    label: s(r["title"]) || "Formation",
    deleted_at: String(r.deleted_at),
    table: "trainings",
    module: "formation",
  }));

  const missions: DeletedRecord[] = asRows(missionsRes).map((r) => ({
    id: String(r.id),
    label: s(r["title"]) || s(r["reference"]) || "Mission",
    deleted_at: String(r.deleted_at),
    table: "missions",
    module: "consultation",
    extra: s(r["reference"]) || undefined,
  }));

  const campaigns: DeletedRecord[] = asRows(campaignsRes).map((r) => ({
    id: String(r.id),
    label: s(r["title"]) || "Campagne",
    deleted_at: String(r.deleted_at),
    table: "campaigns",
    module: "marketing",
  }));

  const leads: DeletedRecord[] = asRows(leadsRes).map((r) => ({
    id: String(r.id),
    label: buildName(r["first_name"], r["last_name"], "Lead"),
    deleted_at: String(r.deleted_at),
    table: "leads",
    module: "marketing",
    extra: s(r["company"]) || undefined,
  }));

  const total =
    clients.length +
    products.length +
    employees.length +
    trainings.length +
    missions.length +
    campaigns.length +
    leads.length;

  return {
    clients,
    products,
    employees,
    trainings,
    missions,
    campaigns,
    leads,
    total,
  };
}
