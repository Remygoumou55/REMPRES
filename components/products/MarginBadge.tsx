"use client";

import { memo } from "react";
import {
  getMarginLevel,
  MARGIN_COLORS,
  MARGIN_BG,
  formatMargin,
} from "@/lib/utils/margin";

type Props = {
  marginPct: number | null | undefined;
  showLabel?: boolean;
};

export const MarginBadge = memo(function MarginBadge({
  marginPct,
  showLabel,
}: Props) {
  const level = getMarginLevel(marginPct);
  if (!level) {
    return (
      <span style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)" }}>
        —
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 999,
        background: MARGIN_BG[level],
        color: MARGIN_COLORS[level],
        whiteSpace: "nowrap",
      }}
    >
      {formatMargin(marginPct)}
      {showLabel && level === "good" && " · Bonne"}
      {showLabel && level === "medium" && " · Moyenne"}
      {showLabel && level === "low" && " · Faible"}
    </span>
  );
});
