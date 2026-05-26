"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, LogOut, Settings, Shield, User } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { normalizeDisplayText } from "@/lib/utils/display-text";
import { UserAvatar } from "./UserAvatar";

type Props = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  agent: "Agent",
  accountant: "Comptable",
  comptable: "Comptable",
  auditor: "Auditeur",
  auditeur: "Auditeur",
  employe: "Employé",
  responsable_vente: "Responsable Vente",
  responsable_rh: "Responsable RH",
  responsable_formation: "Responsable Formation",
  responsable_consultation: "Responsable Consultation",
  responsable_marketing: "Responsable Marketing",
  responsable_logistique: "Responsable Logistique",
};

function AvatarDropdownInner({ name, email, role, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSignOut = useCallback(async () => {
    try {
      document.cookie = "rempres_role=; path=/; max-age=0; SameSite=Lax";
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const roleLabel = role
    ? (ROLE_LABELS[role.toLowerCase()] ?? role)
    : "Utilisateur";

  const displayName = normalizeDisplayText(name) || email || "Compte";

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu utilisateur"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <UserAvatar
          name={name}
          email={email}
          avatarUrl={avatarUrl}
          showOnlineIndicator
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Menu utilisateur"
          style={{
            position: "absolute",
            top: 42,
            right: 0,
            width: 240,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow:
              "0 8px 24px -8px rgba(15, 23, 42, 0.12), 0 2px 6px -2px rgba(15, 23, 42, 0.06)",
            zIndex: 60,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 14px 10px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <UserAvatar
              name={name}
              email={email}
              avatarUrl={avatarUrl}
              size={38}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={displayName}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  marginTop: 2,
                }}
              >
                {roleLabel}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigateTo("/profil?tab=photo")}
            style={{
              margin: "8px 12px",
              border: "1px dashed #cbd5e1",
              borderRadius: 10,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              background: "#f8fafc",
              width: "calc(100% - 24px)",
              textAlign: "left",
            }}
          >
            <Camera size={16} color="#64748b" />
            <span style={{ display: "block" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#0f172a",
                }}
              >
                Changer la photo
              </span>
              <span style={{ display: "block", fontSize: 10, color: "#185FA5" }}>
                Cliquer pour uploader
              </span>
            </span>
          </button>

          <div style={{ height: 1, background: "#f1f5f9", margin: "2px 0" }} />

          <div
            style={{
              padding: "5px 14px 2px",
              fontSize: 10,
              fontWeight: 500,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Mon compte
          </div>

          {[
            { icon: <User size={15} />, label: "Mon profil", href: "/profil" },
            {
              icon: <Settings size={15} />,
              label: "Paramètres",
              href: "/settings",
            },
            {
              icon: <Shield size={15} />,
              label: "Sécurité",
              href: "/profil?tab=securite",
            },
          ].map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => navigateTo(item.href)}
              role="menuitem"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 14px",
                fontSize: 13,
                color: "#0f172a",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                width: "100%",
                textAlign: "left",
              }}
            >
              <span style={{ color: "#64748b", display: "inline-flex" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}

          <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />

          <button
            type="button"
            onClick={handleSignOut}
            role="menuitem"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 14px",
              fontSize: 13,
              color: "#A32D2D",
              cursor: "pointer",
              background: "transparent",
              border: "none",
              width: "100%",
              textAlign: "left",
              marginBottom: 4,
            }}
          >
            <LogOut size={15} />
            Se déconnecter
          </button>
        </div>
      ) : null}
    </div>
  );
}

export const AvatarDropdown = memo(AvatarDropdownInner);
