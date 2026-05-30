"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, Trash2 } from "lucide-react";
import { createQuoteAction } from "@/app/(app)/vente/devis/actions";

type StockItem = {
  id: string;
  name: string;
  unit_price_gnf: number;
};

type ClientOption = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type Line = {
  product_id: string | null;
  product_name: string;
  description: string;
  quantity: number;
  unit_price_gnf: number;
  discount_pct: number;
};

type Props = {
  clients: ClientOption[];
  products: StockItem[];
  onSuccess: (result: { id: string; quote_number: string }) => void;
  onCancel: () => void;
};

function emptyLine(): Line {
  return {
    product_id: null,
    product_name: "",
    description: "",
    quantity: 1,
    unit_price_gnf: 0,
    discount_pct: 0,
  };
}

function formatGnf(n: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} GNF`;
}

function computeLineTotal(qty: number, price: number, disc: number): number {
  return qty * price * (1 - disc / 100);
}

const QuoteForm = memo(function QuoteForm({
  clients,
  products,
  onSuccess,
  onCancel,
}: Props) {
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [paymentConditions, setPaymentConditions] = useState("Paiement à 30 jours");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (acc, line) =>
          acc +
          computeLineTotal(
            Number(line.quantity),
            Number(line.unit_price_gnf),
            Number(line.discount_pct),
          ),
        0,
      ),
    [lines],
  );

  function setLine(index: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function onClientSelect(id: string) {
    setClientId(id);
    if (!id) return;
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setClientName(client.name);
    setClientEmail(client.email ?? "");
    setClientPhone(client.phone ?? "");
  }

  function validate(): string | null {
    if (!clientName.trim()) return "Le nom du client est obligatoire.";
    if (lines.length === 0) return "Ajoutez au moins une ligne.";
    for (const line of lines) {
      if (!line.product_name.trim()) return "Chaque ligne doit avoir une désignation.";
      if (Number(line.quantity) <= 0) return "La quantité doit être supérieure à 0.";
      if (Number(line.unit_price_gnf) < 0) return "Le prix unitaire ne peut pas être négatif.";
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await createQuoteAction({
        client_id: clientId || null,
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        client_phone: clientPhone.trim() || null,
        valid_until: validUntil || null,
        payment_conditions: paymentConditions.trim() || null,
        notes: notes.trim() || null,
        items: lines.map((line, index) => ({
          product_id: line.product_id,
          product_name: line.product_name.trim(),
          description: line.description.trim() || null,
          quantity: Number(line.quantity),
          unit_price_gnf: Number(line.unit_price_gnf),
          discount_pct: Number(line.discount_pct ?? 0),
          position: index,
        })),
      });

      if (!result.success || !result.id || !result.quote_number) {
        setError(result.error ?? "Impossible d'enregistrer le devis.");
        return;
      }

      onSuccess({ id: result.id, quote_number: result.quote_number });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-darktext">Informations client</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Client</label>
            <select
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={clientId}
              onChange={(e) => onClientSelect(e.target.value)}
            >
              <option value="">— Sélectionner un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nom du client *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Téléphone</label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Date de validité
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Conditions de paiement
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={paymentConditions}
              onChange={(e) => setPaymentConditions(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">Notes</label>
            <textarea
              rows={3}
              placeholder="Notes internes ou pour le client..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-darktext">Articles &amp; Services</h3>
          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un article
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const lineTotal = computeLineTotal(
              Number(line.quantity),
              Number(line.unit_price_gnf),
              Number(line.discount_pct),
            );
            return (
              <div
                key={index}
                className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 md:grid-cols-12"
              >
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Produit</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.product_id ?? ""}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setLine(index, { product_id: null });
                        return;
                      }
                      const selected = products.find((p) => p.id === id);
                      setLine(index, {
                        product_id: id,
                        product_name: selected?.name ?? "",
                        unit_price_gnf: Number(selected?.unit_price_gnf ?? 0),
                      });
                    }}
                  >
                    <option value="">— Produit catalogue —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Désignation *</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.product_name}
                    onChange={(e) => setLine(index, { product_name: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Description</label>
                  <input
                    placeholder="Détails optionnels..."
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.description}
                    onChange={(e) => setLine(index, { description: e.target.value })}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-gray-500">Qté *</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.quantity}
                    onChange={(e) => setLine(index, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs text-gray-500">Prix unit. GNF *</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.unit_price_gnf}
                    onChange={(e) =>
                      setLine(index, { unit_price_gnf: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="mb-1 block text-xs text-gray-500">Rem. %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="w-full rounded-lg border border-gray-200 px-2 py-2 text-xs"
                    value={line.discount_pct}
                    onChange={(e) =>
                      setLine(index, { discount_pct: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="flex items-end justify-between gap-2 md:col-span-2">
                  <div>
                    <p className="text-xs text-gray-500">Total ligne</p>
                    <p className="text-sm font-semibold tabular-nums">{formatGnf(lineTotal)}</p>
                  </div>
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end rounded-xl border border-gray-100 bg-white p-4">
          <div className="w-56 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span className="tabular-nums">{formatGnf(subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-darktext">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatGnf(subtotal)}</span>
            </div>
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {pending ? "Enregistrement..." : "Enregistrer le devis"}
        </button>
      </div>
    </form>
  );
});

export default QuoteForm;

type ShellProps = Omit<Props, "onSuccess" | "onCancel">;

export const NewQuoteFormPage = memo(function NewQuoteFormPage(props: ShellProps) {
  const router = useRouter();
  return (
    <QuoteForm
      {...props}
      onSuccess={({ id }) => router.push(`/vente/devis/${id}`)}
      onCancel={() => router.push("/vente/devis")}
    />
  );
});
