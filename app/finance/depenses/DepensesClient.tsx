"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  Plus,
  Filter,
  TrendingDown,
  BarChart2,
  Loader2,
  CheckCircle,
  Pencil,
  Trash2,
  FileText,
  X,
  Paperclip,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { formatGNF } from "@/lib/utils/formatCurrency";
import { formatDateDayFr } from "@/lib/utils/formatDate";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  buildReceiptObjectPath,
  EXPENSE_RECEIPTS_BUCKET,
  validateReceiptFile,
} from "@/lib/expense-receipts";
import type { ExpenseListRow, ExpenseListResult, ExpenseCategoryRow, ExpenseStats } from "@/lib/server/expenses";
import type { ExpensePaymentMethod } from "@/lib/validations/expense";
import {
  attachExpenseReceiptAction,
  createExpenseAction,
  deleteExpenseAction,
  updateExpenseAction,
} from "./actions";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement",
  other: "Autre",
};

type Props = {
  list: ExpenseListResult;
  categories: ExpenseCategoryRow[];
  stats: ExpenseStats;
  filters: { from: string; to: string; categoryId?: string };
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  currentUserId: string;
  isSuperAdmin: boolean;
};

function buildListUrl(updates: Record<string, string | undefined>, base: URLSearchParams) {
  const p = new URLSearchParams(base.toString());
  for (const [k, v] of Object.entries(updates)) {
    if (v === undefined || v === "") p.delete(k);
    else p.set(k, v);
  }
  p.set("page", "1");
  return `/finance/depenses?${p.toString()}`;
}

function receiptPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = getSupabaseBrowserClient().storage
    .from(EXPENSE_RECEIPTS_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

export function DepensesClient({
  list,
  categories,
  stats,
  filters,
  canCreate,
  canUpdate,
  canDelete,
  currentUserId,
  isSuperAdmin,
}: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [payment, setPayment] = useState<ExpensePaymentMethod>("cash");

  const [editing, setEditing] = useState<ExpenseListRow | null>(null);
  const [editReceipt, setEditReceipt] = useState<File | null>(null);
  const [editRemoveReceipt, setEditRemoveReceipt] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const maxCat = useMemo(
    () => Math.max(...stats.byCategory.map((b) => b.total), 1),
    [stats.byCategory],
  );

  const applyFilter = useCallback(
    (key: "from" | "to" | "categoryId", value: string) => {
      const next: Record<string, string | undefined> = {
        from: key === "from" ? value : filters.from,
        to: key === "to" ? value : filters.to,
        categoryId: key === "categoryId" ? value : filters.categoryId,
      };
      if (key === "categoryId" && !value) next.categoryId = undefined;
      startTransition(() => {
        router.push(buildListUrl(next, new URLSearchParams(sp.toString())));
      });
    },
    [filters.from, filters.to, filters.categoryId, router, sp],
  );

  function canEditRow(row: ExpenseListRow) {
    return canUpdate && (row.created_by === currentUserId || isSuperAdmin);
  }
  function canDeleteRow(row: ExpenseListRow) {
    return canDelete && (row.created_by === currentUserId || isSuperAdmin);
  }

  async function onCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const amountNum = Number(String(amount).replace(/\s/g, "").replace(",", "."));

    const result = await createExpenseAction({
      categoryId,
      amountGnf: amountNum,
      description: description.trim(),
      expenseDate,
      paymentMethod: payment,
    });

    if (!result.success) {
      setSaving(false);
      setFormError(result.error);
      return;
    }

    const newId = result.expenseId;
    if (receiptFile && newId) {
      const v = validateReceiptFile(receiptFile);
      if (v) {
        setFormError(v);
        setSaving(false);
        return;
      }
      const path = buildReceiptObjectPath(currentUserId, newId, receiptFile.name);
      const supa = getSupabaseBrowserClient();
      const { error: upErr } = await supa.storage
        .from(EXPENSE_RECEIPTS_BUCKET)
        .upload(path, receiptFile, { contentType: receiptFile.type, upsert: false });
      if (upErr) {
        setFormError("Envoi de la pièce justificative échoué : " + upErr.message);
        setSaving(false);
        return;
      }
      const ar = await attachExpenseReceiptAction(newId, path);
      if (!ar.success) {
        setFormError(ar.error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setToast("Dépense enregistrée.");
    setFormOpen(false);
    setDescription("");
    setAmount("");
    setReceiptFile(null);
    router.refresh();
    setTimeout(() => setToast(null), 3000);
  }

  function openEdit(row: ExpenseListRow) {
    setEditReceipt(null);
    setEditRemoveReceipt(false);
    setEditing(row);
  }

  async function onEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    setSaving(true);
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const amt = Number(String(fd.get("amount")).replace(/\s/g, "").replace(",", "."));

    let receiptPath: string | null | undefined = undefined;
    if (editRemoveReceipt) {
      receiptPath = "";
    } else if (editReceipt) {
      const v = validateReceiptFile(editReceipt);
      if (v) {
        setFormError(v);
        setSaving(false);
        return;
      }
      const path = buildReceiptObjectPath(currentUserId, editing.id, editReceipt.name);
      const supa = getSupabaseBrowserClient();
      const { error: upErr } = await supa.storage
        .from(EXPENSE_RECEIPTS_BUCKET)
        .upload(path, editReceipt, { contentType: editReceipt.type, upsert: true });
      if (upErr) {
        setFormError(upErr.message);
        setSaving(false);
        return;
      }
      receiptPath = path;
    }

    const payload: Parameters<typeof updateExpenseAction>[0] = {
      expenseId: editing.id,
      categoryId: String(fd.get("categoryId")),
      amountGnf: amt,
      description: String(fd.get("description") ?? "").trim(),
      expenseDate: String(fd.get("expenseDate")),
      paymentMethod: String(fd.get("payment")) as ExpensePaymentMethod,
    };
    if (receiptPath !== undefined) {
      payload.receiptPath = receiptPath;
    }

    const res = await updateExpenseAction(payload);

    setSaving(false);
    if (res.success) {
      setToast("Dépense mise à jour.");
      setEditing(null);
      setEditReceipt(null);
      setEditRemoveReceipt(false);
      router.refresh();
      setTimeout(() => setToast(null), 3000);
    } else {
      setFormError(res.error);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Supprimer cette dépense ? Le lien financier sera annulé. Cette action est traçable.")) return;
    setDeleting(id);
    const r = await deleteExpenseAction(id);
    setDeleting(null);
    if (r.success) {
      setToast("Dépense supprimée.");
      router.refresh();
      setTimeout(() => setToast(null), 3000);
    } else {
      setFormError(r.error);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Dépenses"
        subtitle={`${list.total} dépense${list.total > 1 ? "s" : ""} sur la période`}
        actions={
          canCreate && (
            <button
              type="button"
              onClick={() => { setFormOpen((o) => !o); setFormError(null); }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              {formOpen ? <Filter size={16} /> : <Plus size={16} />}
              {formOpen ? "Fermer le formulaire" : "Nouvelle dépense"}
            </button>
          )
        }
      />

      {toast && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle size={16} />
          {toast}
        </div>
      )}

      {formError && !editing && (
        <p className="text-sm text-red-600">{formError}</p>
      )}

      {formOpen && canCreate && (
        <form
          onSubmit={onCreateSubmit}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4"
        >
          <h2 className="text-sm font-bold text-darktext">Nouvelle dépense</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Montant (GNF) *</label>
              <input
                required
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="ex. 1500000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Catégorie *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500">Description *</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Objet de la dépense…"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Date *</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Mode de paiement *</label>
              <select
                value={payment}
                onChange={(e) => setPayment(e.target.value as ExpensePaymentMethod)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="cash">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Virement</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-500">
                <Paperclip size={12} />
                Pièce justificative (PDF ou image, max. 5 Mo)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </button>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Total (période filtrée)"
          value={formatGNF(stats.totalInRange)}
          icon={Wallet}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <KpiCard
          label="Aujourd'hui"
          value={formatGNF(stats.totalToday)}
          icon={TrendingDown}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Mois (mois de la fin de période)"
          value={formatGNF(stats.totalMonth)}
          icon={BarChart2}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
      </div>

      {stats.byCategory.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-darktext">Par catégorie (période)</h3>
          <div className="space-y-2">
            {stats.byCategory.map((b) => (
              <div key={b.categoryId} className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                <div className="min-w-0 flex-1">
                  <div className="h-2 rounded-full bg-gray-100" style={{ maxWidth: "100%" }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.max(4, (b.total / maxCat) * 100)}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </div>
                <span className="w-32 shrink-0 text-right text-xs font-semibold tabular-nums text-darktext">
                  {formatGNF(b.total)}
                </span>
                <span className="w-24 shrink-0 truncate text-xs text-gray-500">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-2 sm:grid-cols-3">
          <div>
            <label className="mb-1 text-xs text-gray-500">Du</label>
            <input
              type="date"
              defaultValue={filters.from}
              onChange={(e) => applyFilter("from", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 text-xs text-gray-500">Au</label>
            <input
              type="date"
              defaultValue={filters.to}
              onChange={(e) => applyFilter("to", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 text-xs text-gray-500">Catégorie</label>
            <select
              value={filters.categoryId ?? ""}
              onChange={(e) => applyFilter("categoryId", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm"
            >
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {pending && <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />}
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {list.data.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BarChart2 className="h-8 w-8 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">Aucune dépense sur cette période</p>
            <p className="text-xs text-gray-400">Modifiez les filtres ou enregistrez une nouvelle dépense.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-3 py-3 font-semibold text-gray-500">Date</th>
                  <th className="px-3 py-3 font-semibold text-gray-500">Catégorie</th>
                  <th className="px-3 py-3 font-semibold text-gray-500">Description</th>
                  <th className="px-3 py-3 font-semibold text-gray-500">Paiement</th>
                  <th className="px-3 py-3 font-semibold text-gray-500">Pièce</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-500">Montant</th>
                  <th className="w-24 px-2 py-3 text-right font-semibold text-gray-500" />
                </tr>
              </thead>
              <tbody>
                {list.data.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 transition hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-gray-600">{formatDateDayFr(row.expense_date)}</td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex max-w-full items-center rounded-lg border px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${row.category_color}18`,
                          color: row.category_color,
                          borderColor: `${row.category_color}55`,
                        }}
                      >
                        {row.category_name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-darktext">{row.description}</td>
                    <td className="px-3 py-3 text-gray-500">
                      {row.payment_method
                        ? (PAYMENT_LABELS[row.payment_method] ?? row.payment_method)
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {receiptPublicUrl(row.receipt_url) ? (
                        <a
                          href={receiptPublicUrl(row.receipt_url) ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <FileText size={12} />
                          Voir
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-rose-700">
                      {formatGNF(row.amount_gnf)}
                    </td>
                    <td className="px-2 py-3 text-right">
                      {canEditRow(row) && (
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition hover:bg-primary/10 hover:text-primary"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDeleteRow(row) && (
                        <button
                          type="button"
                          onClick={() => onDelete(row.id)}
                          disabled={deleting === row.id}
                          className="ml-0.5 inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                          title="Supprimer"
                        >
                          {deleting === row.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {list.totalPages > 1 && <Pagination list={list} sp={sp} />}

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
        >
          <form
            onSubmit={onEditSave}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-darktext">Modifier la dépense</h3>
              <button
                type="button"
                onClick={() => { setEditing(null); setFormError(null); }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-gray-500">Montant (GNF) *</label>
                <input
                  name="amount"
                  defaultValue={String(Math.round(editing.amount_gnf))}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Catégorie *</label>
                <select
                  name="categoryId"
                  defaultValue={editing.category_id}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Description *</label>
                <textarea
                  name="description"
                  defaultValue={editing.description}
                  rows={2}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Date *</label>
                <input
                  type="date"
                  name="expenseDate"
                  defaultValue={editing.expense_date.slice(0, 10)}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Paiement *</label>
                <select
                  name="payment"
                  defaultValue={editing.payment_method ?? "cash"}
                  className="mt-0.5 w-full rounded-xl border border-gray-200 px-3 py-2"
                >
                  <option value="cash">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Virement</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Pièce justificative</label>
                {editing.receipt_url && !editRemoveReceipt && (
                  <p className="mb-1 text-xs text-gray-400">
                    Une pièce est déjà enregistrée. Remplacer le fichier ou la retirer.
                  </p>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={(e) => setEditReceipt(e.target.files?.[0] ?? null)}
                  className="w-full"
                />
                {editing.receipt_url && (
                  <label className="mt-1 flex items-center gap-2 text-xs text-red-600">
                    <input
                      type="checkbox"
                      checked={editRemoveReceipt}
                      onChange={(e) => { setEditRemoveReceipt(e.target.checked); if (e.target.checked) setEditReceipt(null); }}
                    />
                    Retirer la pièce actuelle
                  </label>
                )}
              </div>
            </div>
            {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => { setEditing(null); setFormError(null); }}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Pagination({
  list,
  sp,
}: {
  list: ExpenseListResult;
  sp: ReturnType<typeof useSearchParams>;
}) {
  const pBase = new URLSearchParams(sp.toString());
  const href = (n: number) => {
    const p = new URLSearchParams(pBase.toString());
    p.set("page", String(n));
    return `/finance/depenses?${p.toString()}`;
  };
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600">
      <span>
        Page {list.page} / {list.totalPages}
      </span>
      <div className="flex gap-2">
        <Link
          href={href(list.page - 1)}
          className={`rounded-xl border px-3 py-1.5 font-medium ${
            list.page <= 1
              ? "pointer-events-none border-gray-100 text-gray-300"
              : "border-gray-200 text-primary hover:bg-primary/5"
          }`}
        >
          ← Précédent
        </Link>
        <Link
          href={href(list.page + 1)}
          className={`rounded-xl border px-3 py-1.5 font-medium ${
            list.page >= list.totalPages
              ? "pointer-events-none border-gray-100 text-gray-300"
              : "border-gray-200 text-primary hover:bg-primary/5"
          }`}
        >
          Suivant →
        </Link>
      </div>
    </div>
  );
}
