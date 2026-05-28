"use client";

import { memo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, AlertCircle, CheckSquare, Info } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { timeAgo } from "@/lib/constants/human-messages";
import { ROLE_KEYS, effectiveAuthRoleKey } from "@/lib/auth/roles";

type Props = {
  userId: string | null;
  role: string | null;
  initialUnreadCount?: number;
};

function getNotifIcon(type: string) {
  switch (type) {
    case "approval":
      return <CheckSquare size={14} style={{ color: "#185FA5" }} />;
    case "alert":
      return <AlertCircle size={14} style={{ color: "#BA7517" }} />;
    default:
      return <Info size={14} style={{ color: "#444441" }} />;
  }
}

export const NotificationBell = memo(function NotificationBell({
  userId,
  role,
  initialUnreadCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { unreadCount, notifications, markAllRead } = useRealtimeNotifications({
    userId,
    role,
    initialCount: initialUnreadCount,
  });

  const isSuperAdmin = effectiveAuthRoleKey(role) === ROLE_KEYS.SUPER_ADMIN;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function handleOpen() {
    setOpen((prev) => !prev);
  }

  function goToApprovals() {
    setOpen(false);
    router.push("/actions/approbations");
  }

  function goToAlerts() {
    setOpen(false);
    router.push("/actions/alertes");
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} non lues` : ""}`}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
          background: "var(--color-background-secondary, #f9fafb)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
        }}
      >
        <Bell size={16} color="var(--color-text-secondary, #6b7280)" />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "#E24B4A",
              border: "1.5px solid white",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "13px",
              textAlign: "center",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 0,
            width: 300,
            background: "var(--color-background-primary, #fff)",
            border: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
            borderRadius: "var(--border-radius-lg, 12px)",
            zIndex: 50,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-text-primary, #111827)",
              }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 6,
                    background: "#E24B4A",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "1px 6px",
                    borderRadius: 999,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "#185FA5",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <CheckCheck size={13} />
                Tout marquer lu
              </button>
            )}
          </div>

          {isSuperAdmin && (
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "8px 12px",
                borderBottom: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
                background: "var(--color-background-secondary, #f9fafb)",
              }}
            >
              <button
                type="button"
                onClick={goToApprovals}
                style={{
                  flex: 1,
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: "var(--border-radius-md, 8px)",
                  border: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
                  background: "var(--color-background-primary, #fff)",
                  cursor: "pointer",
                  color: "var(--color-text-primary, #111827)",
                }}
              >
                Approbations
              </button>
              <button
                type="button"
                onClick={goToAlerts}
                style={{
                  flex: 1,
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: "var(--border-radius-md, 8px)",
                  border: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
                  background: "var(--color-background-primary, #fff)",
                  cursor: "pointer",
                  color: "var(--color-text-primary, #111827)",
                }}
              >
                Alertes
              </button>
            </div>
          )}

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "24px 14px", textAlign: "center" }}>
                <Bell
                  size={32}
                  style={{
                    color: "var(--color-border-secondary, #d1d5db)",
                    margin: "0 auto 8px",
                    display: "block",
                  }}
                />
                <div style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)" }}>
                  Aucune notification
                </div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (notif.action_url) {
                      setOpen(false);
                      router.push(notif.action_url);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && notif.action_url) {
                      setOpen(false);
                      router.push(notif.action_url);
                    }
                  }}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
                    background: notif.read
                      ? "var(--color-background-primary, #fff)"
                      : "var(--color-background-secondary, #f9fafb)",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    cursor: notif.action_url ? "pointer" : "default",
                  }}
                >
                  <div style={{ marginTop: 2 }}>{getNotifIcon(notif.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--color-text-primary, #111827)",
                        marginBottom: 2,
                      }}
                    >
                      {notif.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-secondary, #6b7280)",
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.message}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--color-text-secondary, #6b7280)",
                        marginTop: 3,
                      }}
                    >
                      {timeAgo(notif.created_at)}
                    </div>
                  </div>
                  {!notif.read && (
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#185FA5",
                        flexShrink: 0,
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              setOpen(false);
              router.push(isSuperAdmin ? "/actions/alertes" : "/actions/approbations");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setOpen(false);
                router.push(isSuperAdmin ? "/actions/alertes" : "/actions/approbations");
              }
            }}
            style={{
              padding: "8px 14px",
              textAlign: "center",
              fontSize: 12,
              color: "#185FA5",
              cursor: "pointer",
              borderTop: "0.5px solid var(--color-border-tertiary, #e5e7eb)",
            }}
          >
            Voir toutes les notifications
          </div>
        </div>
      )}
    </div>
  );
});
