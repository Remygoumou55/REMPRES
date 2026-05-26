"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";

import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  changePasswordAction,
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
} from "./actions";

type Tab = "photo" | "infos" | "securite";

type Props = {
  initialTab: Tab;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  role: string | null;
};

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: "photo", label: "Photo de profil" },
  { id: "infos", label: "Informations" },
  { id: "securite", label: "Sécurité" },
];

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfilClient({
  initialTab,
  fullName,
  email,
  avatarUrl,
  role,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl);
  const [currentName, setCurrentName] = useState<string>(fullName);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearStatus() {
    setStatusMessage(null);
  }

  function handleSelectFile() {
    clearStatus();
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setStatusMessage({
        tone: "error",
        text: "Format non supporté. JPG, PNG ou WebP uniquement.",
      });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setStatusMessage({
        tone: "error",
        text: "Fichier trop volumineux. Taille maximum : 2 Mo.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      if (!result.success) {
        setStatusMessage({
          tone: "error",
          text: result.error ?? "Erreur lors de l'upload.",
        });
        return;
      }
      setCurrentAvatar(result.avatarUrl ?? null);
      setStatusMessage({ tone: "success", text: "Photo mise à jour." });
      router.refresh();
    });
  }

  function handleRemove() {
    clearStatus();
    startTransition(async () => {
      const result = await removeAvatarAction();
      if (!result.success) {
        setStatusMessage({
          tone: "error",
          text: result.error ?? "Erreur lors de la suppression.",
        });
        return;
      }
      setCurrentAvatar(null);
      setStatusMessage({ tone: "success", text: "Photo supprimée." });
      router.refresh();
    });
  }

  function handleInfosSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearStatus();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("full_name") ?? "").trim();
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (!result.success) {
        setStatusMessage({
          tone: "error",
          text: result.error ?? "Erreur lors de la sauvegarde.",
        });
        return;
      }
      setCurrentName(nextName);
      setStatusMessage({ tone: "success", text: "Informations mises à jour." });
      router.refresh();
    });
  }

  function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearStatus();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (!result.success) {
        setStatusMessage({
          tone: "error",
          text: result.error ?? "Erreur lors du changement de mot de passe.",
        });
        return;
      }
      form.reset();
      setStatusMessage({ tone: "success", text: "Mot de passe mis à jour." });
    });
  }

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                clearStatus();
                setTab(t.id);
              }}
              className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-[#185FA5] text-[#185FA5] font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {statusMessage ? (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            statusMessage.tone === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
          role="status"
        >
          {statusMessage.text}
        </div>
      ) : null}

      {tab === "photo" ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-medium text-gray-900">
            Photo de profil
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            JPG, PNG ou WebP. Taille maximum : 2 Mo.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <UserAvatar
              name={currentName}
              email={email}
              avatarUrl={currentAvatar}
              size={96}
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSelectFile}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#185FA5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0C447C] disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                Choisir une photo
              </button>
              {currentAvatar ? (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 self-start text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                  Supprimer la photo
                </button>
              ) : null}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </section>
      ) : null}

      {tab === "infos" ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-medium text-gray-900">
            Informations personnelles
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Mettez à jour votre nom et vos coordonnées.
          </p>

          <form onSubmit={handleInfosSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="full_name"
                className="mb-1 block text-xs font-medium text-gray-700"
              >
                Nom complet
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                defaultValue={currentName}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-xs font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email ?? ""}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                L&apos;email est lié à votre compte et ne peut pas être modifié ici.
              </p>
            </div>
            {role ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Rôle
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {role}
                </div>
              </div>
            ) : null}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#185FA5] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0C447C] disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Enregistrer
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === "securite" ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="mb-1 text-lg font-medium text-gray-900">Sécurité</h2>
          <p className="mb-6 text-sm text-gray-500">
            Changez votre mot de passe. Choisissez un mot de passe d&apos;au moins 8 caractères.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new_password"
                className="mb-1 block text-xs font-medium text-gray-700"
              >
                Nouveau mot de passe
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
              />
            </div>
            <div>
              <label
                htmlFor="confirm_password"
                className="mb-1 block text-xs font-medium text-gray-700"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#185FA5] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#185FA5] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0C447C] disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                Changer le mot de passe
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
