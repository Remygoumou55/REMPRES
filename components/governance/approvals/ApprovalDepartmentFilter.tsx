type ApprovalDepartmentFilterProps = {
  options: string[];
  selected: string;
};

export function ApprovalDepartmentFilter({ options, selected }: ApprovalDepartmentFilterProps) {
  return (
    <select
      name="department"
      defaultValue={selected}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      <option value="">Tous les departements</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
