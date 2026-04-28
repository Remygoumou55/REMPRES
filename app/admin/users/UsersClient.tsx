"use client";

import { useState, useTransition } from "react";
import {
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Clock,
  UserX,
  UserCheck,
  MoreVertical,
  X,
  Send,
  CheckCircle,
  AlertCircle,
  Ban,
} from "lucide-react";
import type { UserListItem } from "@/lib/server/users";
import {
  inviteUserAction,
  resendInviteAction,
  deactivateUserAction,
  reactivateUserAction,
} from "./actions";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const ROLES = [
  { key: "super_admin",            label: "Super Admin" },
  { key: "directeur_general",      label: "Directeur Général" },
  { key: "responsable_vente",      label: "Responsable Vente" },
  { key: "responsable_rh",         label: "Responsable RH" },
  { key: "responsable_formation",  label: "Responsable Formation" },
  { key: "responsable_consultation", label: "Responsable Consultation" },
  { key: "responsable_marketing",  label: "Responsable Marketing" },
  { key: "responsable_logistique", label: "Responsable Logistique" },
  { key: "comptable",              label: "Comptable" },
  { key: "auditeur",               label: "Auditeur" },
  { key: "employe",                label: "Employé" },
] as const;

const DEPARTMENTS = [
  "Vente", "Finance", "RH", "Formation",
  "Consultation", "Marketing", "Logistique", "Direction",
];

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
}: {
  onClose: () => void;
  onSuccess: () => void;
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
        setTimeout(() => { onClose(); onSuccess(); }, 1500);
      } else {
        setError(result.error ?? "Erreur inconnue.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Inviter un utilisateur</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
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
                <input name="firstName" required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Jean" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nom *</label>
                <input name="lastName" required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Dupont" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email *</label>
              <input name="email" type="email" required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="jean.dupont@rempres.com" />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Rôle *</label>
              <select name="roleKey" required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Département</label>
              <select name="departmentKey"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">— Aucun département —</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d.toLowerCase()}>{d}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={pending}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {pending ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : <Send size={15} />}
                {pending ? "Envoi…" : "Envoyer l'invitation"}
              </button>
            </div>
          </form>
        )}
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
}: {
  user: UserListItem;
  onRefresh: () => void;
}) {
  const [open, setOpen]       = useState(false);
  const [pending, start]      = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  async function doResend() {
    start(async () => {
      const r = await resendInviteAction(user.id);
      setFeedback(r.success ? "Invitation renvoyée !" : (r.error ?? "Erreur"));
      setOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  async function doBlock() {
    if (!confirm(`Bloquer le compte de ${user.email} ?\n\nCet utilisateur ne pourra plus se connecter.`)) return;
    start(async () => {
      const r = await deactivateUserAction(user.id);
      setFeedback(r.success ? "✓ Compte bloqué." : (r.error ?? "Erreur"));
      setOpen(false);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  async function doUnblock() {
    start(async () => {
      const r = await reactivateUserAction(user.id);
      setFeedback(r.success ? "✓ Compte débloqué." : (r.error ?? "Erreur"));
      setOpen(false);
      onRefresh();
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  return (
    <div className="relative">
      {feedback && (
        <span className="absolute -top-8 right-0 z-10 whitespace-nowrap rounded-xl bg-gray-800 px-2.5 py-1.5 text-xs text-white shadow-lg">
          {feedback}
        </span>
      )}
      <button onClick={() => setOpen(!open)} disabled={pending}
        className="rounded-xl p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 min-w-[200px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          {user.status === "pending" && (
            <button onClick={doResend}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 transition hover:bg-gray-50">
              <RefreshCw size={14} />
              Renvoyer l&apos;invitation
            </button>
          )}
          {user.status === "active" && (
            <button onClick={doBlock}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50">
              <UserX size={14} />
              Bloquer l&apos;accès
            </button>
          )}
          {user.status === "inactive" && (
            <button onClick={doUnblock}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 transition hover:bg-emerald-50">
              <UserCheck size={14} />
              Débloquer l&apos;accès
            </button>
          )}
        </div>
      )}
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
  const [users, setUsers]         = useState<UserListItem[]>(initialUsers);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch]       = useState("");
  const [refreshBanner, setRefreshBanner] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.role_label ?? "").toLowerCase().includes(q)
    );
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
          return;
        }

        const data = body as UserListItem[];
        if (Array.isArray(data)) {
          setUsers(data);
          setRefreshBanner(null);
        } else {
          setRefreshBanner("Réponse invalide du serveur.");
        }
      } catch {
        setRefreshBanner("Réseau indisponible. Réessayez.");
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
        <input
          type="search"
          placeholder="Rechercher par nom, email ou rôle…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Utilisateur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Rôle</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Département</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">Dernière connexion</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  {search ? "Aucun utilisateur ne correspond à votre recherche." : "Aucun utilisateur pour l'instant."}
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(user.full_name ?? user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.full_name || <span className="italic text-gray-400">Sans nom</span>}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <ShieldCheck size={11} />
                      {user.role_label ?? user.role_key ?? "—"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                    {user.department_key ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-gray-400 lg:table-cell">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                      : "Jamais connecté"
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserActionsMenu user={user} onRefresh={handleRefresh} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <InviteModal
          onClose={() => setShowModal(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
