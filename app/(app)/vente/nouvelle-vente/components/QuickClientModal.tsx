"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, X, Loader2, Users, Building2 } from "lucide-react";
import type { Client } from "@/types/client";
import { createQuickClientAction } from "../actions";
import {
  ModalField,
  ModalInput,
  ModalError,
} from "@/components/ui/modal";

type QuickClientForm = {
  clientType: "individual" | "company";
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

const EMPTY_FORM: QuickClientForm = {
  clientType: "individual",
  firstName: "",
  lastName: "",
  companyName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
};

export function QuickClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const [form, setForm]     = useState<QuickClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function set(key: keyof QuickClientForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await createQuickClientAction({
        clientType:  form.clientType,
        firstName:   form.firstName,
        lastName:    form.lastName,
        companyName: form.companyName,
        phone:       form.phone,
        email:       form.email || null,
        address:     form.address || null,
        city:        form.city || null,
      });

      if (!mountedRef.current) return;
      setSaving(false);

      if (result.success) {
        setForm(EMPTY_FORM);
        onCreated(result.client);
      } else {
        setError(result.error);
      }
    } catch {
      if (!mountedRef.current) return;
      setSaving(false);
      setError("Impossible de créer le client pour le moment.");
    }
  }

  const isIndividual = form.clientType === "individual";

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Carte */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">

        {/* En-tête */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserPlus size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-darktext">Nouveau client</h2>
            <p className="mt-0.5 text-xs text-gray-400">Créer et sélectionner automatiquement</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps du formulaire */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Type client */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Type de client</p>
            <div className="grid grid-cols-2 gap-2">
              {(["individual", "company"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("clientType", t)}
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                    form.clientType === t
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary"
                  }`}
                >
                  {t === "individual" ? <Users size={14} /> : <Building2 size={14} />}
                  {t === "individual" ? "Particulier" : "Entreprise"}
                </button>
              ))}
            </div>
          </div>

          {/* Identité */}
          {isIndividual ? (
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Prénom" required>
                <ModalInput
                  autoFocus
                  required
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Malin"
                />
              </ModalField>
              <ModalField label="Nom">
                <ModalInput
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Loua"
                />
              </ModalField>
            </div>
          ) : (
            <ModalField label="Nom entreprise" required>
              <ModalInput
                autoFocus
                required
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Nom de l'entreprise"
              />
            </ModalField>
          )}

          {/* Téléphone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Téléphone" required>
                <ModalInput
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="623 00 00 00"
                />
              </ModalField>
              <ModalField label="Email">
                <ModalInput
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="email@exemple.com"
                />
              </ModalField>
          </div>

          {/* Adresse + Ville */}
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Adresse">
                <ModalInput
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Quartier, rue…"
                />
              </ModalField>
            <ModalField label="Ville">
              <ModalInput
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Conakry"
              />
            </ModalField>
          </div>

          {/* Erreur */}
          <ModalError message={error} />

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Création…</>
              ) : (
                <><UserPlus size={14} /> Créer et sélectionner</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
