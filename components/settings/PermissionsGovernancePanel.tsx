import { GOVERNED_ERP_ROLES } from "@/lib/settings/governance-roles";
import { ROLE_OPTIONS_UI } from "@/lib/auth/roles";
import { DEPARTMENT_OPTIONS_UI } from "@/lib/departments/department-config";

export function PermissionsGovernancePanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-darktext">Modèle de permissions ERP</h2>
        <p className="mt-2 text-xs leading-relaxed text-gray-600">
          Chaque utilisateur possède <strong>un département principal</strong> et <strong>un rôle générique</strong>.
          Les libellés MANAGER_* décrivent l&apos;association département + rôle manager — pas une multiplication de rôles
          par utilisateur.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {GOVERNED_ERP_ROLES.map((role) => (
          <article key={role.key} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="font-mono text-xs font-bold text-primary">{role.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{role.description}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Référentiel technique (lecture)</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-600">Rôles génériques (DB)</p>
            <ul className="space-y-1 text-xs text-gray-700">
              {ROLE_OPTIONS_UI.map((r) => (
                <li key={r.key}>
                  <span className="font-mono text-gray-500">{r.key}</span> — {r.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-600">Départements</p>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-xs text-gray-700">
              {DEPARTMENT_OPTIONS_UI.map((d) => (
                <li key={d.key}>{d.label}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-[11px] text-gray-500">
          La matrice fine module × action reste dans la table <code className="rounded bg-white px-1">permissions</code> —
          gérée par l&apos;équipe technique, pas exposée comme chaos UI.
        </p>
      </section>
    </div>
  );
}
