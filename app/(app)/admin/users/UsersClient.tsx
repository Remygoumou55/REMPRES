"use client";

import { useMemo, useState, useTransition } from "react";
import {
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Clock,
  UserX,
  UserCheck,
  X,
  Send,
  CheckCircle,
  AlertCircle,
  Ban,
  Pencil,
  Trash2,
} from "lucide-react";
import type { UserListItem } from "@/lib/server/users";
import { SearchInput } from "@/components/ui/search-input";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import {
  inviteUserAction,
  resendInviteAction,
  deactivateUserAction,
  reactivateUserAction,
  updateUserAdminAction,
  deleteUserAdminAction,
} from "./actions";
import { useToast } from "@/components/providers/ToastProvider";
import {
  DataTable,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
  DataTableCell,
  DataTableEmpty,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { ROLE_OPTIONS_UI } from "@/lib/auth/roles";
import { DEPARTMENT_OPTIONS_UI } from "@/lib/departments/department-config";

/** Bouton action icône seule — compact, lisible au survol (title) */
const ACTION_ICON =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border transition outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-45";

// ---------------------------------------------------------------------------
// Badge statut
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: UserListItem["status"] }) {
  const cfg = {
    active:   { label: "Actif",    icon: CheckCircle, cls: "bg-emerald-100 text-emerald-700" },
    pending:  { label: "En attente", icon: Clock,     cls: "bg-amber-100 text-amber-700"    },
    inactive: { label: "Bloqué",   icon: Ban,         cls: "bg-red-100 text-red-600"         },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Modal invitation
// ---------------------------------------------------------------------------

function InviteModal({
  onClose,
  onSuccess,
  onNotifySuccess,
  onNotifyError,
}: {
  onClose: () => void;
  onSuccess: () => void;
  onNotifySuccess: (message?: string) => void;
  onNotifyError: (message?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await inviteUserAction(fd);
      if (result.success) {
        setSuccess(true);
        onNotifySuccess("Opération réussie");
        setTimeout(() => { onClose(); onSuccess(); }, 1500);
      } else {
        const message = result.error ?? "Une erreur est survenue";
        setError(message);
        onNotifyError(message);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Inviter un utilisateur</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle size={48} className="text-green-500" />
            <p className="font-semibold text-gray-900">Invitation envoyée !</p>
            <p className="text-sm text-gray-500">L&apos;utilisateur recevra un email pour créer son mot de passe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Prénom *</label>
                <Input name="firstName" required placeholder="Jean" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nom *</label>
                <Input name="lastName" required placeholder="Dupont" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email *</label>
              <Input name="email" type="email" required placeholder="jean.dupont@rempres.com" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Rôle *</label>
              <Select name="roleKey" required>
                {ROLE_OPTIONS_UI.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Département</label>
              <Select name="departmentKey">
                <option value="">— Aucun département —</option>
                {DEPARTMENT_OPTIONS_UI.map((d) => (
                  <option key={d.key} value={d.key}>{d.label}</option>
                ))}
              </Select>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" onClick={onClose} variant="outline" className="flex-1 h-10 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </Button>
              <Button type="submit" variant="primary" loading={pending} loadingText="Traitement en cours..." className="flex-1 h-10 text-sm font-bold text-white">
                {!pending ? <Send size={15} /> : null}
                Envoyer l&apos;invitation
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal édition utilisateur
// ---------------------------------------------------------------------------

function EditUserModal({
  user,
  onClose,
  onSaved,
  onNotifyError,
}: {
  user: UserListItem;
  onClose: () => void;
  onSaved: () => void;
  onNotifyError: (message?: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [roleKey, setRoleKey] = useState(user.role_key ?? "agent");
  const [departmentKey, setDepartmentKey] = useState(user.department_key ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateUserAdminAction(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        roleKey,
        departmentKey: departmentKey || null,
      });
      if (result.success) {
        onSaved();
      } else {
        const msg = result.error ?? "Impossible de modifier l’utilisateur.";
        setError(msg);
        onNotifyError(msg);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Modifier l&apos;utilisateur</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la fenêtre"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Prénom *</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nom *</label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Rôle *</label>
            <Select value={roleKey} onChange={(e) => setRoleKey(e.target.value)} required>
              {ROLE_OPTIONS_UI.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Département</label>
            <Select value={departmentKey} onChange={(e) => setDepartmentKey(e.target.value)}>
              <option value="">— Aucun département —</option>
              {DEPARTMENT_OPTIONS_UI.map((d) => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </Select>
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 h-10 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Annuler
            </Button>
            <Button type="submit" variant="primary" loading={pending} loadingText="Traitement en cours..." className="flex-1 h-10 text-sm font-bold text-white">
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Menu actions par utilisateur
// ---------------------------------------------------------------------------

function UserActionsMenu({
  user,
  onRefresh,
  onNotifySuccess,
  onNotifyError,
}: {
  user: UserListItem;
  onRefresh: () => void;
  onNotifySuccess: (message?: string) => void;
  onNotifyError: (message?: string) => void;
}) {
  const [pending, start]      = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<null | "block" | "delete">(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const displayName = (user.full_name ?? "").trim() || "Utilisateur sans nom";
  const emailLine = user.email ? ` (${user.email})` : "";

  async function doResend() {
    start(async () => {
      const r = await resendInviteAction(user.id);
      if (r.success) onNotifySuccess("Opération réussie");
      else onNotifyError(r.error ?? "Échec de l’opération");
    });
  }

  async function executeBlock() {
    setConfirmBusy(true);
    try {
      const r = await deactivateUserAction(user.id);
      if (r.success) onNotifySuccess("Accès désactivé");
      else onNotifyError(r.error ?? "Échec de l’opération");
      onRefresh();
    } finally {
      setConfirmBusy(false);
      setConfirmKind(null);
    }
  }

  async function doUnblock() {
    start(async () => {
      const r = await reactivateUserAction(user.id);
      if (r.success) onNotifySuccess("Opération réussie");
      else onNotifyError(r.error ?? "Échec de l’opération");
      onRefresh();
    });
  }

  async function executeDelete() {
    setConfirmBusy(true);
    try {
      const r = await deleteUserAdminAction(user.id);
      if (r.success) onNotifySuccess("Compte supprimé");
      else onNotifyError(r.error ?? "Échec de l’opération");
      onRefresh();
    } finally {
      setConfirmBusy(false);
      setConfirmKind(null);
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        disabled={pending}
        title="Modifier le profil"
        aria-label="Modifier le profil"
        className={`${ACTION_ICON} border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50`}
      >
        <Pencil size={15} strokeWidth={2} />
      </button>
      {user.status === "pending" && (
        <button
          type="button"
          onClick={doResend}
          disabled={pending || confirmBusy}
          title="Renvoyer l’invitation par e-mail"
          aria-label="Renvoyer l’invitation par e-mail"
          className={`${ACTION_ICON} border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50`}
        >
          <RefreshCw size={15} strokeWidth={2} />
        </button>
      )}
      {user.status === "active" && (
        <button
          type="button"
          onClick={() => setConfirmKind("block")}
          disabled={pending || confirmBusy}
          title="Désactiver l’accès au compte"
          aria-label="Désactiver l’accès au compte"
          className={`${ACTION_ICON} border-red-200 bg-white text-red-600 hover:border-red-300 hover:bg-red-50`}
        >
          <UserX size={15} strokeWidth={2} />
        </button>
      )}
      {user.status === "inactive" && (
        <button
          type="button"
          onClick={doUnblock}
          disabled={pending || confirmBusy}
          title="Réactiver l’accès au compte"
          aria-label="Réactiver l’accès au compte"
          className={`${ACTION_ICON} border-emerald-200 bg-white text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50`}
        >
          <UserCheck size={15} strokeWidth={2} />
        </button>
      )}
      <button
        type="button"
        onClick={() => setConfirmKind("delete")}
        disabled={pending || confirmBusy}
        title="Supprimer définitivement le compte"
        aria-label="Supprimer définitivement le compte"
        className={`${ACTION_ICON} border-red-300 bg-white text-red-700 hover:border-red-400 hover:bg-red-50`}
      >
        <Trash2 size={15} strokeWidth={2} />
      </button>
      {editOpen && (
        <EditUserModal
          user={user}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            onNotifySuccess("Utilisateur modifié");
            onRefresh();
          }}
          onNotifyError={onNotifyError}
        />
      )}
      <ConfirmDangerDialog
        open={confirmKind === "block"}
        title="Désactiver l’accès au compte"
        message={`Vous allez désactiver l’accès pour « ${displayName} »${emailLine}. Cette personne ne pourra plus se connecter à RemPres tant que le compte n’est pas réactivé. L’opération est tracée dans le journal d’activité.`}
        confirmLabel="Désactiver l’accès"
        loadingLabel="Désactivation…"
        loading={confirmBusy}
        onCancel={() => !confirmBusy && setConfirmKind(null)}
        onConfirm={() => void executeBlock()}
      />
      <ConfirmDangerDialog
        open={confirmKind === "delete"}
        title="Supprimer définitivement le compte"
        message={`Vous demandez la suppression définitive du compte « ${displayName} »${emailLine}. Le profil sera retiré et l’accès à l’application sera supprimé. Cette opération ne peut pas être annulée. Ne confirmez qu’après vérification et si vous disposez de l’autorisation requise.`}
        confirmLabel="Supprimer définitivement"
        loadingLabel="Suppression…"
        loading={confirmBusy}
        onCancel={() => !confirmBusy && setConfirmKind(null)}
        onConfirm={() => void executeDelete()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

interface Props {
  initialUsers: UserListItem[];
}

export function UsersClient({ initialUsers }: Props) {
  const { showSuccess, showError } = useToast();
  const [users, setUsers]         = useState<UserListItem[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [refreshBanner, setRefreshBanner] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();

  const searchFields = useMemo(
    () => [
      "full_name" as const,
      "email" as const,
      "role_label" as const,
      "role_key" as const,
      "department_key" as const,
      (u: UserListItem) => [u.first_name, u.last_name],
    ],
    [],
  );

  const { query, setQuery, filteredData: filtered, suggestions } = useGlobalSearch<UserListItem>({
    data: users,
    searchFields,
    delay: 220,
  });

  function handleRefresh() {
    setRefreshBanner(null);
    startRefresh(async () => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });
        const body = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            body && typeof body === "object" && body !== null && "error" in body
              ? String((body as { error?: string }).error ?? "")
              : "";
          setRefreshBanner(
            msg || `Erreur ${res.status} — impossible de rafraîchir la liste.`,
          );
          showError("Une erreur est survenue");
          return;
        }

        const data = body as UserListItem[];
        if (Array.isArray(data)) {
          setUsers(data);
          setRefreshBanner(null);
        } else {
          setRefreshBanner("Réponse invalide du serveur.");
          showError("Une erreur est survenue");
        }
      } catch {
        setRefreshBanner("Réseau indisponible. Réessayez.");
        showError("Une erreur est survenue");
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} compte{users.length > 1 ? "s" : ""} —{" "}
            {users.filter((u) => u.status === "active").length} actif{users.filter((u) => u.status === "active").length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {refreshBanner && (
            <p role="alert" className="max-w-[min(420px,80vw)] text-right text-xs text-amber-800">
              {refreshBanner}
            </p>
          )}
          <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
            <UserPlus size={16} />
            Inviter un utilisateur
          </button>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="mb-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          onSuggestionSelect={setQuery}
          suggestions={suggestions}
          placeholder="Rechercher (nom, email, rôle, département...)"
          className="w-full max-w-sm"
        />
      </div>

      {/* Tableau */}
      <DataTable>
        <table className="w-full text-sm">
          <DataTableHead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <DataTableHeaderCell>Utilisateur</DataTableHeaderCell>
              <DataTableHeaderCell>Rôle</DataTableHeaderCell>
              <DataTableHeaderCell className="hidden sm:table-cell">Département</DataTableHeaderCell>
              <DataTableHeaderCell>Statut</DataTableHeaderCell>
              <DataTableHeaderCell className="hidden lg:table-cell">Dernière connexion</DataTableHeaderCell>
              <DataTableHeaderCell className="w-[1%] whitespace-nowrap text-right">Actions</DataTableHeaderCell>
            </tr>
          </DataTableHead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <DataTableEmpty
                colSpan={6}
                title={query ? "Aucun résultat" : "Aucun utilisateur"}
                description={query ? "Aucun utilisateur ne correspond à votre recherche." : "Aucun utilisateur pour l'instant."}
              />
            ) : (
              filtered.map((user) => {
                const nameForInitial = (user.full_name ?? "").trim();
                const initial =
                  nameForInitial.length > 0
                    ? nameForInitial.charAt(0).toUpperCase()
                    : (user.role_key ?? "?").charAt(0).toUpperCase();
                const subline = (user.department_key ?? "").trim() || null;
                return (
                <DataTableRow key={user.id}>
                  <DataTableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initial}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || <span className="italic text-gray-400">Sans nom</span>}
                        </p>
                        {subline ? (
                          <p className="text-xs text-gray-500">{subline}</p>
                        ) : null}
                      </div>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <ShieldCheck size={11} />
                      {user.role_label ?? user.role_key ?? "—"}
                    </span>
                  </DataTableCell>
                  <DataTableCell className="hidden text-gray-500 sm:table-cell">
                    {user.department_key ?? <span className="text-gray-300">—</span>}
                  </DataTableCell>
                  <DataTableCell>
                    <StatusBadge status={user.status} />
                  </DataTableCell>
                  <DataTableCell className="hidden text-xs text-gray-400 lg:table-cell">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                      : "Jamais connecté"
                    }
                  </DataTableCell>
                  <DataTableCell className="whitespace-nowrap text-right">
                    <UserActionsMenu
                      user={user}
                      onRefresh={handleRefresh}
                      onNotifySuccess={showSuccess}
                      onNotifyError={showError}
                    />
                  </DataTableCell>
                </DataTableRow>
              );
              })
            )}
          </tbody>
        </table>
      </DataTable>

      {/* Modal */}
      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onSuccess={handleRefresh}
          onNotifySuccess={showSuccess}
          onNotifyError={showError}
        />
      )}
    </div>
  );
}



