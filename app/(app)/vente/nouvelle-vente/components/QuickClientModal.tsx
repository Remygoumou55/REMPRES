"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Users, Building2 } from "lucide-react";
import type { Client } from "@/types/client";
import { createQuickClientAction } from "../actions";
import {
  Modal,
  ModalField,
  ModalInput,
  ModalError,
  ModalActions,
  ModalSectionHeading,
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

function toUserFacingClientError(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (
    t.startsWith("NEXT_") ||
    t.includes("Digest:") ||
    /^\w+Error:/.test(t) ||
    t.includes(" at ") ||
    t.includes(".ts:")
  ) {
    return "Impossible d’enregistrer ce client. Vérifiez les informations ou réessayez.";
  }
  return t;
}

export function QuickClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}) {
  const [form, setForm] = useState<QuickClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  function setKey(key: keyof QuickClientForm, value: string) {
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
        clientType: form.clientType,
        firstName: form.firstName,
        lastName: form.lastName,
        companyName: form.companyName,
        phone: form.phone,
        email: form.email || null,
        address: form.address || null,
        city: form.city || null,
      });

      if (!mountedRef.current) return;
      setSaving(false);

      if (result.success) {
        setForm(EMPTY_FORM);
        onCreated(result.client);
      } else {
        setError(toUserFacingClientError(result.error) ?? "Création impossible pour le moment.");
      }
    } catch {
      if (!mountedRef.current) return;
      setSaving(false);
      setError("Impossible de créer le client pour le moment.");
    }
  }

  const isIndividual = form.clientType === "individual";

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) handleClose();
      }}
      title="Nouveau client"
      subtitle="Création rapide puis sélection automatique"
      icon={<UserPlus size={18} />}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <ModalSectionHeading>Type de client</ModalSectionHeading>
          <div className="grid grid-cols-2 gap-2">
            {(["individual", "company"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setKey("clientType", t)}
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

        <div>
          <ModalSectionHeading>{isIndividual ? "Identité" : "Raison sociale"}</ModalSectionHeading>
          {isIndividual ? (
            <div className="grid grid-cols-2 gap-3">
              <ModalField label="Prénom" required>
                <ModalInput
                  autoFocus
                  required
                  value={form.firstName}
                  onChange={(e) => setKey("firstName", e.target.value)}
                  placeholder="Prénom"
                />
              </ModalField>
              <ModalField label="Nom">
                <ModalInput
                  value={form.lastName}
                  onChange={(e) => setKey("lastName", e.target.value)}
                  placeholder="Nom"
                />
              </ModalField>
            </div>
          ) : (
            <ModalField label="Nom entreprise" required>
              <ModalInput
                autoFocus
                required
                value={form.companyName}
                onChange={(e) => setKey("companyName", e.target.value)}
                placeholder="Nom de l’entreprise"
              />
            </ModalField>
          )}
        </div>

        <div>
          <ModalSectionHeading>Coordonnées</ModalSectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Téléphone" required>
              <ModalInput
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setKey("phone", e.target.value)}
                placeholder="623 00 00 00"
              />
            </ModalField>
            <ModalField label="Email">
              <ModalInput
                type="email"
                value={form.email}
                onChange={(e) => setKey("email", e.target.value)}
                placeholder="email@exemple.com"
              />
            </ModalField>
          </div>
        </div>

        <div>
          <ModalSectionHeading>Localisation</ModalSectionHeading>
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Adresse">
              <ModalInput
                value={form.address}
                onChange={(e) => setKey("address", e.target.value)}
                placeholder="Quartier, rue…"
              />
            </ModalField>
            <ModalField label="Ville">
              <ModalInput
                value={form.city}
                onChange={(e) => setKey("city", e.target.value)}
                placeholder="Conakry"
              />
            </ModalField>
          </div>
        </div>

        <ModalError message={error} />

        <ModalActions
          onCancel={() => {
            if (!saving) handleClose();
          }}
          submitLabel="Créer et sélectionner"
          loading={saving}
          submitLoadingText="Création…"
          submitIcon={<UserPlus size={14} />}
        />
      </form>
    </Modal>
  );
}
