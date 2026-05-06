"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export function useRowSelection(visibleIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const visible = new Set(visibleIds);
    setSelectedIds((prev) => prev.filter((id) => visible.has(id)));
  }, [visibleIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCount = selectedIds.length;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleAllVisible = useCallback(() => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      for (const id of visibleIds) merged.add(id);
      return Array.from(merged);
    });
  }, [allVisibleSelected, visibleIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

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
