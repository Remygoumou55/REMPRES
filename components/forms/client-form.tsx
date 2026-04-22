"use client";

import Link from "next/link";
import { useState } from "react";
import type { ClientType } from "@/types/client";
import { FlashMessage } from "@/components/ui/flash-message";

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
  cancelHref?: string;
  successMessage?: string;
  errorMessage?: string;
};

export function ClientForm({
  title,
  submitLabel,
  action,
  initialValues,
  cancelHref = "/vente/clients",
  successMessage,
  errorMessage,
}: ClientFormProps) {
  const [clientType, setClientType] = useState<ClientType>(
    initialValues?.client_type ?? "individual",
  );

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-darktext">{title}</h1>
        <div className="mt-4">
          <FlashMessage success={successMessage} error={errorMessage} />
        </div>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="client_type">
              Type de client
            </label>
            <select
              id="client_type"
              name="client_type"
              value={clientType}
              onChange={(event) => setClientType(event.target.value as ClientType)}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="individual">Individuel</option>
              <option value="company">Entreprise</option>
            </select>
          </div>

          {clientType === "individual" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="first_name">
                  Prénom
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  defaultValue={initialValues?.first_name ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="last_name">
                  Nom
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  defaultValue={initialValues?.last_name ?? ""}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  required
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="company_name">
                Nom de l&apos;entreprise
              </label>
              <input
                id="company_name"
                name="company_name"
                defaultValue={initialValues?.company_name ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={initialValues?.email ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="phone">
                Téléphone
              </label>
              <input
                id="phone"
                name="phone"
                defaultValue={initialValues?.phone ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="city">
                Ville
              </label>
              <input
                id="city"
                name="city"
                defaultValue={initialValues?.city ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="country">
                Pays
              </label>
              <input
                id="country"
                name="country"
                defaultValue={initialValues?.country ?? ""}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="address">
              Adresse
            </label>
            <input
              id="address"
              name="address"
              defaultValue={initialValues?.address ?? ""}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-darktext" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={initialValues?.notes ?? ""}
              className="min-h-[120px] w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              {submitLabel}
            </button>
            <Link
              href={cancelHref}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
