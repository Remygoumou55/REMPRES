"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wallet,
  Plus,
  TrendingDown,
  BarChart2,
  Loader2,
  CheckCircle,
  Pencil,
  Trash2,
  FileText,
  Paperclip,
  Receipt,
  Save,
} from "lucide-react";
import {
  Modal,
  ModalField,
  ModalInput,
  ModalTextarea,
  ModalSelect,
  ModalError,
  ModalActions,
} from "@/components/ui/modal";
import { SearchInput } from "@/components/ui/search-input";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { formatMoney } from "@/lib/utils/formatCurrency";
import { formatCurrency } from "@/utils/currency";
import { formatDateDayFr } from "@/lib/utils/formatDate";
import { useCurrencyStore } from "@/stores/currencyStore";
import { convertAmount } from "@/lib/currencyService";
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

  // Devise sélectionnée par l'utilisateur
  const currency = useCurrencyStore((s) => s.selectedCurrency);
  const rates    = useCurrencyStore((s) => s.rates);
  function fmtD(amountGNF: number) {
    return formatMoney(convertAmount(amountGNF, currency, rates), currency, 1);
  }
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  const maxCat = useMemo(
    () => Math.max(...stats.byCategory.map((b) => b.total), 1),
    [stats.byCategory],
  );

  const searchFields = useMemo(
    () => [
      "description" as const,
      "category_name" as const,
      "payment_method" as const,
      "expense_date" as const,
      (r: ExpenseListRow) => [r.amount_gnf, r.category_name],
    ],
    [],
  );

  const { query, setQuery, filteredData: filteredRows, suggestions } = useGlobalSearch<ExpenseListRow>({
    data: list.data,
    searchFields,
    delay: 220,
  });

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

  const typedAmountGNF = useMemo(
    () => Number(String(amount).replace(/\s/g, "").replace(",", ".")) || 0,
    [amount],
  );

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
              onClick={() => { setFormOpen(true); setFormError(null); }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
            >
              <Plus size={16} />
              Nouvelle dépense
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

      {/* Modal — Nouvelle dépense */}
      <Modal
        open={formOpen && canCreate}
        onClose={() => { setFormOpen(false); setFormError(null); }}
        title="Nouvelle dépense"
        subtitle="Saisie d'une dépense"
        icon={<Receipt size={18} />}
        size="md"
      >
        <form onSubmit={onCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Montant (GNF)" required>
              <ModalInput
                autoFocus
                required
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ex. 1 500 000"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                {currency === "GNF"
                  ? "Montant enregistré en GNF."
                  : `${formatCurrency(convertAmount(typedAmountGNF, currency, rates), currency)} ≈ ${formatCurrency(typedAmountGNF, "GNF")}`}
              </p>
            </ModalField>
            <ModalField label="Catégorie" required>
              <ModalSelect
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </ModalSelect>
            </ModalField>
          </div>

          <ModalField label="Description" required>
            <ModalTextarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Objet de la dépense…"
            />
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Date" required>
              <ModalInput
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </ModalField>
            <ModalField label="Mode de paiement" required>
              <ModalSelect
                value={payment}
                onChange={(e) => setPayment(e.target.value as ExpensePaymentMethod)}
              >
                <option value="cash">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Virement</option>
                <option value="other">Autre</option>
              </ModalSelect>
            </ModalField>
          </div>

          <ModalField label="Pièce justificative (PDF / image, max. 5 Mo)">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-400 transition hover:border-primary/40 hover:text-primary/70">
              <Paperclip size={14} />
              {receiptFile ? receiptFile.name : "Choisir un fichier…"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
          </ModalField>

          <ModalError message={formError} />

          <ModalActions
            onCancel={() => { setFormOpen(false); setFormError(null); }}
            submitLabel="Enregistrer"
            loading={saving}
            submitIcon={<Plus size={14} />}
          />
        </form>
      </Modal>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Total (période filtrée)"
          value={fmtD(stats.totalInRange)}
          icon={Wallet}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
        />
        <KpiCard
          label="Aujourd'hui"
          value={fmtD(stats.totalToday)}
          icon={TrendingDown}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Mois (mois de la fin de période)"
          value={fmtD(stats.totalMonth)}
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
                  {fmtD(b.total)}
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

      <SearchInput
        value={query}
        onChange={setQuery}
        onSuggestionSelect={setQuery}
        suggestions={suggestions}
        placeholder="Recherche instantanée (description, catégorie, paiement, montant...)"
        className="w-full sm:max-w-md"
      />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <BarChart2 className="h-8 w-8 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">
              {query ? "Aucune dépense ne correspond à votre recherche" : "Aucune dépense sur cette période"}
            </p>
            <p className="text-xs text-gray-400">
              {query ? "Essayez un autre mot-clé." : "Modifiez les filtres ou enregistrez une nouvelle dépense."}
            </p>
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
                {filteredRows.map((row) => (
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
                      <div className="text-right">
                        <span>{fmtD(row.amount_gnf)}</span>
                        {currency !== "GNF" ? (
                          <p className="text-[10px] font-normal text-gray-400">≈ {formatCurrency(row.amount_gnf, "GNF")}</p>
                        ) : null}
                      </div>
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
                          onClick={() => setConfirmDeleteId(row.id)}
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

      {/* Modal — Modifier la dépense */}
      <Modal
        open={!!editing}
        onClose={() => { setEditing(null); setFormError(null); }}
        title="Modifier la dépense"
        subtitle={editing ? `#${editing.id.slice(0, 8)}` : undefined}
        icon={<Pencil size={18} />}
        size="md"
      >
        {editing && (
          <form onSubmit={onEditSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Montant (GNF)" required>
                <ModalInput
                  autoFocus
                  name="amount"
                  defaultValue={String(Math.round(editing.amount_gnf))}
                />
              </ModalField>
              <ModalField label="Catégorie" required>
                <ModalSelect name="categoryId" defaultValue={editing.category_id}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </ModalSelect>
              </ModalField>
            </div>

            <ModalField label="Description" required>
              <ModalTextarea name="description" defaultValue={editing.description} rows={2} />
            </ModalField>

            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Date" required>
                <ModalInput type="date" name="expenseDate" defaultValue={editing.expense_date.slice(0, 10)} />
              </ModalField>
              <ModalField label="Paiement" required>
                <ModalSelect name="payment" defaultValue={editing.payment_method ?? "cash"}>
                  <option value="cash">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank_transfer">Virement</option>
                  <option value="other">Autre</option>
                </ModalSelect>
              </ModalField>
            </div>

            <ModalField label="Pièce justificative">
              {editing.receipt_url && !editRemoveReceipt && (
                <p className="mb-1.5 text-xs text-gray-400">Une pièce est déjà enregistrée.</p>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-400 transition hover:border-primary/40 hover:text-primary/70">
                <Paperclip size={14} />
                {editReceipt ? editReceipt.name : "Remplacer le fichier…"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  onChange={(e) => setEditReceipt(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              {editing.receipt_url && (
                <label className="mt-1.5 flex items-center gap-2 text-xs text-red-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editRemoveReceipt}
                    onChange={(e) => { setEditRemoveReceipt(e.target.checked); if (e.target.checked) setEditReceipt(null); }}
                  />
                  Retirer la pièce actuelle
                </label>
              )}
            </ModalField>

            <ModalError message={formError} />

            <ModalActions
              onCancel={() => { setEditing(null); setFormError(null); }}
              submitLabel="Enregistrer"
              loading={saving}
              submitIcon={<Save size={14} />}
            />
          </form>
        )}
      </Modal>
      <ConfirmDangerDialog
        open={!!confirmDeleteId}
        title="Confirmer la suppression"
        message="Supprimer cette dépense ? Le lien financier sera annulé. Cette action est traçable."
        confirmLabel="Confirmer"
        loadingLabel="Traitement…"
        loading={!!deleting}
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (!confirmDeleteId) return;
          const id = confirmDeleteId;
          setConfirmDeleteId(null);
          void onDelete(id);
        }}
      />
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

