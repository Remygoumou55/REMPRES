"use client";

import { useEffect, useMemo, useState } from "react";

export function useRowSelection(visibleIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const visible = new Set(visibleIds);
    setSelectedIds((prev) => prev.filter((id) => visible.has(id)));
  }, [visibleIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      for (const id of visibleIds) merged.add(id);
      return Array.from(merged);
    });
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  return {
    selectedIds,
    selectedSet,
    selectedCount,
    allVisibleSelected,
    toggleOne,
    toggleAllVisible,
    clearSelection,
  };
}
