/** Colonnes alignées header / body — une seule table + table-fixed. */
export function ClientsTableColGroup({ canDelete }: { canDelete: boolean }) {
  if (canDelete) {
    return (
      <colgroup>
        <col style={{ width: 48 }} />
        <col style={{ width: "30%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "26%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: 112 }} />
      </colgroup>
    );
  }
  return (
    <colgroup>
      <col style={{ width: "34%" }} />
      <col style={{ width: "16%" }} />
      <col style={{ width: "28%" }} />
      <col style={{ width: "18%" }} />
      <col style={{ width: 112 }} />
    </colgroup>
  );
}

export const clientsTableHeadClass =
  "sticky top-0 z-10 border-b border-gray-100 bg-gray-50/95 text-xs font-semibold uppercase tracking-wide text-gray-500 backdrop-blur-sm";

export const clientsThClass = "px-4 py-3 text-left font-semibold";

export const clientsTdClass = "px-4 py-3.5 align-middle";
