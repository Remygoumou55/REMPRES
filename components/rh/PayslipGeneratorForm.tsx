"use client";

import { memo, useState, useMemo, useTransition } from "react";
import { Download, Eye, Loader2 } from "lucide-react";
import type { EmployeePayslipData, PayslipData } from "@/components/rh/PayslipPDF";
import type { CreatePayslipInput } from "@/lib/server/payslips";

type Props = {
  employee: EmployeePayslipData;
  onSave: (input: CreatePayslipInput) => Promise<{ success: boolean; id?: string; payslipData?: PayslipData; error?: string }>;
};

const MONTHS = [
  { value: 1, label: "Janvier" }, { value: 2, label: "Février" },
  { value: 3, label: "Mars" }, { value: 4, label: "Avril" },
  { value: 5, label: "Mai" }, { value: 6, label: "Juin" },
  { value: 7, label: "Juillet" }, { value: 8, label: "Août" },
  { value: 9, label: "Septembre" }, { value: 10, label: "Octobre" },
  { value: 11, label: "Novembre" }, { value: 12, label: "Décembre" },
];

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

function fmtGNF(n: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " GNF";
}

export const PayslipGeneratorForm = memo(function PayslipGeneratorForm({ employee, onSave }: Props) {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [salary, setSalary] = useState(Number(employee.salary_gnf ?? 0));
  const [bonus, setBonus] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [daysWorked, setDaysWorked] = useState(26);
  const [daysAbsent, setDaysAbsent] = useState(0);
  const [leaveDays, setLeaveDays] = useState(0);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);

  const net = useMemo(() => Math.max(0, salary + bonus - deductions), [salary, bonus, deductions]);

  function buildInput(): CreatePayslipInput {
    return {
      employee_id: employee.id,
      month,
      year,
      salary_gnf: salary,
      bonus_gnf: bonus,
      deductions_gnf: deductions,
      days_worked: daysWorked,
      days_absent: daysAbsent,
      leave_days: leaveDays,
      notes: notes.trim() || undefined,
      generated_by: "", // will be filled server-side via session
    };
  }

  async function handleSaveAndDownload() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await onSave(buildInput());
      if (!res.success) {
        setError(res.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      setSuccess("Fiche enregistrée.");
      if (res.payslipData) {
        setIsDownloading(true);
        try {
          const { downloadPayslipPDF } = await import("@/components/rh/PayslipPDF");
          await downloadPayslipPDF(res.payslipData, employee);
        } finally {
          setIsDownloading(false);
        }
      }
    });
  }

  async function handlePreviewOnly() {
    setError(null);
    setIsDownloading(true);
    try {
      const { downloadPayslipPDF } = await import("@/components/rh/PayslipPDF");
      const fakePayslip: PayslipData = {
        id: "preview",
        month, year,
        salary_gnf: salary,
        bonus_gnf: bonus,
        deductions_gnf: deductions,
        net_salary_gnf: net,
        days_worked: daysWorked,
        days_absent: daysAbsent,
        leave_days: leaveDays,
        notes: notes.trim() || null,
        generated_at: new Date().toISOString(),
      };
      await downloadPayslipPDF(fakePayslip, employee);
    } finally {
      setIsDownloading(false);
    }
  }

  const busy = isPending || isDownloading;

  return (
    <div className="card space-y-5 p-6">
      <h3 className="text-base font-semibold text-darktext">Générer une fiche de paie</h3>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <label className="form-label">Mois</label>
          <select
            className="input"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            disabled={busy}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Année</label>
          <input
            type="number"
            className="input"
            value={year}
            min={2020}
            max={2099}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={busy}
          />
        </div>
        <div>
          <label className="form-label">Jours travaillés</label>
          <input
            type="number"
            className="input"
            value={daysWorked}
            min={0}
            max={31}
            onChange={(e) => setDaysWorked(Number(e.target.value))}
            disabled={busy}
          />
        </div>
        <div>
          <label className="form-label">Jours absents</label>
          <input
            type="number"
            className="input"
            value={daysAbsent}
            min={0}
            max={31}
            onChange={(e) => setDaysAbsent(Number(e.target.value))}
            disabled={busy}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <label className="form-label">Salaire de base (GNF)</label>
          <input
            type="number"
            className="input"
            value={salary}
            min={0}
            onChange={(e) => setSalary(Number(e.target.value))}
            disabled={busy}
          />
        </div>
        <div>
          <label className="form-label">Prime / Bonus (GNF)</label>
          <input
            type="number"
            className="input"
            value={bonus}
            min={0}
            onChange={(e) => setBonus(Number(e.target.value))}
            disabled={busy}
          />
        </div>
        <div>
          <label className="form-label">Retenues / Déductions (GNF)</label>
          <input
            type="number"
            className="input"
            value={deductions}
            min={0}
            onChange={(e) => setDeductions(Number(e.target.value))}
            disabled={busy}
          />
        </div>
        <div>
          <label className="form-label">Jours de congé</label>
          <input
            type="number"
            className="input"
            value={leaveDays}
            min={0}
            max={31}
            onChange={(e) => setLeaveDays(Number(e.target.value))}
            disabled={busy}
          />
        </div>
      </div>

      <div>
        <label className="form-label">Notes (optionnel)</label>
        <textarea
          className="input min-h-[72px] resize-y"
          placeholder="Observations, primes exceptionnelles…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={busy}
        />
      </div>

      {/* Live preview */}
      <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <span className="text-sm font-semibold text-primary">NET À PAYER</span>
        <span className="text-xl font-bold text-primary">{fmtGNF(net)}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSaveAndDownload}
          disabled={busy}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Enregistrer et télécharger PDF
        </button>
        <button
          type="button"
          onClick={handlePreviewOnly}
          disabled={busy}
          className="btn-secondary inline-flex items-center gap-2 text-sm"
        >
          {isDownloading && !isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Aperçu PDF seulement
        </button>
      </div>
    </div>
  );
});
