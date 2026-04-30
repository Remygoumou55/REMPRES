"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, Phone, Mail, MapPin, FileText, Globe, Save, Plus } from "lucide-react";
import type { ClientType } from "@/types/client";
import {
  Modal,
  ModalField,
  ModalInput,
  ModalTextarea,
  ModalError,
  ModalActions,
} from "@/components/ui/modal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClientFormValues = {
  client_type?: ClientType;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  notes?: string | null;
};

type ClientFormProps = {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: ClientFormValues;
  /** URL de retour après annulation ou succès */
  cancelHref?: string;
  successMessage?: string;
  errorMessage?: string;
};

// ---------------------------------------------------------------------------
// ClientForm — rendu sous forme de Modal
// ---------------------------------------------------------------------------

export function ClientForm({
  title,
  submitLabel,
  action,
  initialValues,
  cancelHref = "/vente/clients",
  errorMessage,
}: ClientFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(errorMessage ?? null);
  const [clientType, setClientType] = useState<ClientType>(
    initialValues?.client_type ?? "individual",
  );

  const isIndividual = clientType === "individual";

  function handleCancel() {
    router.push(cancelHref);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <Modal
      open
      onClose={handleCancel}
      title={title}
      subtitle={isIndividual ? "Particulier" : "Entreprise"}
      icon={isIndividual ? <Users size={18} /> : <Building2 size={18} />}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Type */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Type de client</p>
          <div className="grid grid-cols-2 gap-2">
            {(["individual", "company"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setClientType(t)}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                  clientType === t
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:border-primary/30 hover:text-primary"
                }`}
              >
                {t === "individual" ? <Users size={14} /> : <Building2 size={14} />}
                {t === "individual" ? "Particulier" : "Entreprise"}
              </button>
            ))}
          </div>
          {/* Champ caché pour le server action */}
          <input type="hidden" name="client_type" value={clientType} />
        </div>

        {/* Identité */}
        {isIndividual ? (
          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Prénom" required>
              <ModalInput
                autoFocus
                name="first_name"
                required
                defaultValue={initialValues?.first_name ?? ""}
                placeholder="Malin"
              />
            </ModalField>
            <ModalField label="Nom">
              <ModalInput
                name="last_name"
                defaultValue={initialValues?.last_name ?? ""}
                placeholder="Loua"
              />
            </ModalField>
          </div>
        ) : (
          <ModalField label="Nom de l'entreprise" required>
            <ModalInput
              autoFocus
              name="company_name"
              required
              defaultValue={initialValues?.company_name ?? ""}
              placeholder="Nom de l'entreprise"
            />
          </ModalField>
        )}

        {/* Téléphone + Email */}
        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Téléphone">
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                name="phone"
                type="tel"
                defaultValue={initialValues?.phone ?? ""}
                placeholder="623 00 00 00"
                className="pl-8"
              />
            </div>
          </ModalField>
          <ModalField label="Email">
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                name="email"
                type="email"
                defaultValue={initialValues?.email ?? ""}
                placeholder="email@exemple.com"
                className="pl-8"
              />
            </div>
          </ModalField>
        </div>

        {/* Adresse + Ville + Pays */}
        <div className="grid grid-cols-3 gap-3">
          <ModalField label="Adresse">
            <div className="relative">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                name="address"
                defaultValue={initialValues?.address ?? ""}
                placeholder="Quartier…"
                className="pl-8"
              />
            </div>
          </ModalField>
          <ModalField label="Ville">
            <ModalInput
              name="city"
              defaultValue={initialValues?.city ?? ""}
              placeholder="Conakry"
            />
          </ModalField>
          <ModalField label="Pays">
            <div className="relative">
              <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <ModalInput
                name="country"
                defaultValue={initialValues?.country ?? "Guinée"}
                placeholder="Guinée"
                className="pl-8"
              />
            </div>
          </ModalField>
        </div>

        {/* Notes */}
        <ModalField label="Notes">
          <div className="relative">
            <FileText size={13} className="absolute left-3 top-3 text-gray-400" />
            <ModalTextarea
              name="notes"
              rows={3}
              defaultValue={initialValues?.notes ?? ""}
              placeholder="Informations complémentaires…"
              className="pl-8"
            />
          </div>
        </ModalField>

        <ModalError message={error} />

        <ModalActions
          onCancel={handleCancel}
          submitLabel={submitLabel}
          loading={pending}
          submitIcon={initialValues ? <Save size={14} /> : <Plus size={14} />}
        />
      </form>
    </Modal>
  );
}
