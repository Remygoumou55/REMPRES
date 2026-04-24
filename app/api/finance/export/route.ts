import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { insertActivityLog } from "@/lib/server/insert-activity-log";
import { logError } from "@/lib/logger";
import { getModulePermissions, isSuperAdmin } from "@/lib/server/permissions";
import {
  type CsvExportSections,
  getFinanceCfoData,
  buildFinanceExportCsv,
  buildFinanceExportCsvSections,
} from "@/lib/server/finance-overview";
import { parseCategoryIds, parseCreatedBy } from "@/lib/finance-query-params";
import { FinanceReportPdf } from "@/components/pdf/FinanceReportPdf";
import type { Json } from "@/types/database.types";

function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(s: string | null, fallback: string): string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return fallback;
  return s;
}

function clampOrder(from: string, to: string): { from: string; to: string } {
  if (from > to) return { from: to, to: from };
  return { from, to };
}

async function tryLogFinanceExport(
  userId: string,
  from: string,
  to: string,
  format: "csv" | "pdf",
  extra: Record<string, Json> = {},
) {
  try {
    await insertActivityLog({
      actorUserId: userId,
      moduleKey: "finance",
      actionKey: "export",
      targetTable: "finance_export",
      targetId: null,
      metadata: { from, to, format, ...extra },
    });
  } catch (e) {
    logError("FINANCE_EXPORT_ACTIVITY_LOG", e, { userId, from, to, format });
  }
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const perms = await getModulePermissions(auth.user.id, ["finance"]);
  if (!perms.canRead) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const superAdmin = await isSuperAdmin(auth.user.id);
  const url = new URL(request.url);
  const t = today();
  const { from, to } = clampOrder(
    parseDate(url.searchParams.get("from"), firstDayOfMonth()),
    parseDate(url.searchParams.get("to"), t),
  );
  const allCat = url.searchParams.getAll("category");
  const finalCats = parseCategoryIds(allCat.length ? allCat : url.searchParams.get("category") ?? undefined);

  const createdBy = parseCreatedBy(
    url.searchParams.get("createdBy") ?? undefined,
    superAdmin,
  );

  const format = url.searchParams.get("format") ?? "csv";
  const data = await getFinanceCfoData(supabase, {
    from,
    to,
    categoryIds: finalCats,
    createdByUserId: createdBy,
  });

  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "pdf") {
    const buf = await renderToBuffer(
      React.createElement(FinanceReportPdf, {
        data,
        from,
        to,
        generatedAt: new Date().toLocaleString("fr-FR", { timeZone: "UTC" }),
      }) as React.ReactElement,
    );
    await tryLogFinanceExport(auth.user.id, from, to, "pdf", { source: "get" });
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="finance-${dateStamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = buildFinanceExportCsv(data, from, to);
  await tryLogFinanceExport(auth.user.id, from, to, "csv", { source: "get" });
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance-${dateStamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

type ExportPostBody = {
  from: string;
  to: string;
  categoryIds?: string[];
  createdBy?: string | null;
  format: "csv" | "pdf";
  csvSections?: {
    includeSummary: boolean;
    includeDeltas: boolean;
    includeDaily: boolean;
    includeCategories: boolean;
  };
  pdfSections?: { summary: boolean; deltas: boolean; daily: boolean; categories: boolean };
};

/**
 * Export personnalisé (sélecteur de sections) — POST JSON.
 */
export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const perms = await getModulePermissions(auth.user.id, ["finance"]);
  if (!perms.canRead) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }
  const superAdmin = await isSuperAdmin(auth.user.id);

  let body: ExportPostBody;
  try {
    body = (await request.json()) as ExportPostBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const t = today();
  const { from, to } = clampOrder(
    parseDate(typeof body.from === "string" ? body.from : null, firstDayOfMonth()),
    parseDate(typeof body.to === "string" ? body.to : null, t),
  );
  const categoryIds = parseCategoryIds(
    Array.isArray(body.categoryIds) ? body.categoryIds.map(String) : undefined,
  );
  const createdBy = parseCreatedBy(
    body.createdBy == null ? undefined : String(body.createdBy),
    superAdmin,
  );

  const data = await getFinanceCfoData(supabase, {
    from,
    to,
    categoryIds,
    createdByUserId: createdBy,
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const format = body.format === "pdf" ? "pdf" : "csv";

  const defaultCsv: CsvExportSections = {
    includeSummary: true,
    includeDeltas: true,
    includeDaily: true,
    includeCategories: true,
  };
  const csvS = { ...defaultCsv, ...body.csvSections };

  const defaultPdf = { summary: true, deltas: true, daily: true, categories: true };
  const pdfS = { ...defaultPdf, ...body.pdfSections };

  if (format === "pdf") {
    const buf = await renderToBuffer(
      React.createElement(FinanceReportPdf, {
        data,
        from,
        to,
        generatedAt: new Date().toLocaleString("fr-FR", { timeZone: "UTC" }),
        sections: pdfS,
      }) as React.ReactElement,
    );
    await tryLogFinanceExport(auth.user.id, from, to, "pdf", {
      source: "post",
      post: true,
    });
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="finance-${dateStamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const csv = buildFinanceExportCsvSections(data, from, to, csvS);
  await tryLogFinanceExport(auth.user.id, from, to, "csv", {
    source: "post",
    post: true,
  });
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="finance-${dateStamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
