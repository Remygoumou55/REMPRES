"use client";

import { memo } from "react";
import Image from "next/image";

type Props = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
  onClick?: () => void;
  showOnlineIndicator?: boolean;
  ariaLabel?: string;
};

const PALETTE: ReadonlyArray<{ bg: string; text: string }> = [
  { bg: "#E6F1FB", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#EEEDFE", text: "#3C3489" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#E1F5EE", text: "#085041" },
  { bg: "#FAECE7", text: "#712B13" },
];

function getInitials(name?: string | null, email?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0]!.toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim()[0]!.toUpperCase();
  }
  return "U";
}

function pickPalette(name?: string | null, email?: string | null) {
  const seed = (name ?? email ?? "U").trim() || "U";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

function UserAvatarInner({
  name,
  email,
  avatarUrl,
  size = 34,
  onClick,
  showOnlineIndicator = false,
  ariaLabel,
}: Props) {
  const initials = getInitials(name, email);
  const palette = pickPalette(name, email);
  const altLabel = ariaLabel ?? name ?? email ?? "Avatar";
  const clickable = Boolean(onClick);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
      }}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? altLabel : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "2px solid #185FA5",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: avatarUrl ? "transparent" : palette.bg,
          color: palette.text,
          fontSize: Math.round(size * 0.38),
          fontWeight: 500,
          lineHeight: 1,
          cursor: clickable ? "pointer" : "default",
          flexShrink: 0,
          transition: "box-shadow 0.15s ease",
        }}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={altLabel}
            width={size}
            height={size}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </div>
      {showOnlineIndicator ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 1,
            right: 1,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#1D9E75",
            border: "1.5px solid white",
          }}
        />
      ) : null}
    </div>
  );
}

export const UserAvatar = memo(UserAvatarInner);
