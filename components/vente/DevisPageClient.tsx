"use client";

import { memo, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import QuoteForm from "@/components/vente/QuoteForm";
import { deleteQuoteAction, getQuotePdfAction } from "@/app/(app)/vente/devis/actions";
import type { Quote, QuoteStatus } from "@/lib/server/quotes";

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  accepted: "Accepté",
  refused: "Refusé",
  expired: "Expiré",
  converted: "Converti en vente",
};

const QUOTE_STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string }> = {
  draft: { bg: "#F1EFE8", text: "#444441" },
  sent: { bg: "#E6F1FB", text: "#0C447C" },
  accepted: { bg: "#EAF3DE", text: "#27500A" },
  refused: { bg: "#FCEBEB", text: "#791F1F" },
  expired: { bg: "#FAEEDA", text: "#633806" },
  converted: { bg: "#EEEDFE", text: "#3C3489" },
};

const STATUS_ORDER: QuoteStatus[] = [
  "draft",
  "sent",
  "accepted",
  "refused",
  "expired",
  "converted",
];

type ClientOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  unit_price_gnf: number;
};

type Props = {
  quotes: Quote[];
  clients: ClientOption[];
  products: ProductOption[];
  stats: Record<string, number>;
};

function formatGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

function isPastDue(
  validUntil: string | null,
  status: QuoteStatus,
): boolean {
  if (!validUntil) return false;
  const terminal = new Set<QuoteStatus>([
    "accepted",
    "refused",
    "expired",
    "converted",
  ]);
  if (terminal.has(status)) return false;
  return new Date(validUntil) < new Date();
}

function ListQuotePdfButton({ quote }: { quote: Quote }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const full = await getQuotePdfAction(quote.id);
      if (!full) return;

      const [{ pdf }, { default: QuotePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/vente/QuotePDF"),
      ]);

      const blob = await pdf(<QuotePDF quote={full} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = full.client_name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 30);
      link.href = url;
      link.download = `${full.quote_number}_${safeName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("QuotePDF error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      title={`Télécharger ${quote.quote_number}`}
      className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "…" : "PDF"}
    </button>
  );
}

function DevisPageClientInner({ quotes, clients, products, stats }: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totalAll = useMemo(
    () => STATUS_ORDER.reduce((acc, key) => acc + (stats[key] ?? 0), 0),
    [stats],
  );

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    return quotes.filter((q) => {
      const okStatus = statusFilter === "all" || q.status === statusFilter;
      const okSearch =
        !needle ||
        q.client_name.toLowerCase().includes(needle) ||
        q.quote_number.toLowerCase().includes(needle);
      return okStatus && okSearch;
    });
  }, [quotes, searchTerm, statusFilter]);

  function handleDelete(id: string, quoteNumber: string) {
    if (!window.confirm(`Supprimer le devis ${quoteNumber} ?`)) return;
    startTransition(async () => {
      const result = await deleteQuoteAction(id);
      setMessage(
        result.success
          ? `Devis ${quoteNumber} supprimé.`
          : result.error ?? "Suppression impossible.",
      );
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tous ({totalAll})
          </button>
          {STATUS_ORDER.map((status) => {
            const colors = QUOTE_STATUS_COLORS[status];
            const count = stats[status] ?? 0;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: statusFilter === status ? colors.text : colors.bg,
                  color: statusFilter === status ? "#fff" : colors.text,
                }}
              >
                {QUOTE_STATUS_LABELS[status]} ({count})
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Nouveau devis
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Rechercher par client ou n° devis..."
          className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {message ? (
        <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700">
          {message}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <FileText className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun devis enregistré</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            Créer le premier devis
          </button>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-3">N° Devis</th>
                <th className="p-3">Client</th>
                <th className="p-3">Articles</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Validité</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote) => {
                const colors = QUOTE_STATUS_COLORS[quote.status];
                const overdue = isPastDue(quote.valid_until, quote.status);
                return (
                  <tr key={quote.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <Link
                        href={`/vente/devis/${quote.id}`}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {quote.quote_number}
                      </Link>
                    </td>
                    <td className="p-3">{quote.client_name}</td>
                    <td className="p-3">{quote.items_count} article(s)</td>
                    <td className="p-3 text-right tabular-nums">
                      {formatGnf(quote.total_gnf)}
                    </td>
                    <td
                      className={`p-3 text-xs ${
                        overdue ? "font-semibold text-red-700" : "text-gray-600"
                      }`}
                    >
                      {quote.valid_until ? formatDateShort(quote.valid_until) : "—"}
                    </td>
                    <td className="p-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {QUOTE_STATUS_LABELS[quote.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <ListQuotePdfButton quote={quote} />
                        <Link
                          href={`/vente/devis/${quote.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Voir
                        </Link>
                        {["draft", "refused"].includes(quote.status) ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleDelete(quote.id, quote.quote_number)}
                            className="inline-flex items-center text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau devis"
        subtitle="Créer un devis commercial"
        size="4xl"
      >
        <QuoteForm
          clients={clients}
          products={products}
          onCancel={() => setShowCreateModal(false)}
          onSuccess={({ quote_number }) => {
            setMessage(`Devis ${quote_number} créé.`);
            setShowCreateModal(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}

export const DevisPageClient = memo(DevisPageClientInner);
