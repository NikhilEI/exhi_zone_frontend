"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../_lib/apiClient";
import { useSession } from "../_lib/SessionProvider";

interface TopbarProps {
  onMenuToggle: () => void;
  eventName?: string;
}

interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: number;
  created_at: string;
}

const TYPE_ICON: Record<string, string> = {
  success: "bx-check-circle",
  warning: "bx-error-circle",
  error: "bx-x-circle",
  info: "bx-info-circle"
};

const TYPE_COLOR: Record<string, string> = {
  success: "var(--ez-success)",
  warning: "var(--ez-warning)",
  error: "var(--ez-danger)",
  info: "var(--ez-primary)"
};

export default function Topbar({ onMenuToggle, eventName }: TopbarProps) {
  const router = useRouter();
  const { user, logout } = useSession();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    function fetchNotifications() {
      api
        .get<{ notifications: AppNotification[] }>("/notifications?pageSize=10")
        .then((body) => {
          if (!cancelled) setNotifications(body.notifications);
        })
        .catch(() => {});
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/exhibitor-zone/login");
  }

  async function markAllRead() {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // Non-critical — the list simply won't reflect the read state until next poll.
    }
  }

  const initials = user ? `${user.firstName[0] || ""}${user.lastName[0] || ""}`.toUpperCase() || "?" : "?";
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="layout-navbar" aria-label="Top navigation">
      <div className="navbar-left">
        <button id="sidebarToggleBtn" className="navbar-toggle" onClick={onMenuToggle} aria-label="Toggle sidebar" aria-expanded="false">
          <i className="bx bx-menu" style={{ fontSize: "1.5rem" }} />
        </button>

        {eventName && (
          <div
            className="navbar-event-badge"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.75rem",
              background: "var(--ez-primary-light)",
              borderRadius: "50rem",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--ez-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "min(50vw, 260px)"
            }}
          >
            <i className="bx bx-calendar-event" style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{eventName}</span>
          </div>
        )}
      </div>

      <div className="navbar-right">
        <div className="dropdown" ref={notifRef} style={{ position: "relative" }}>
          <button
            id="notificationsBtn"
            className="btn btn-ghost btn-icon"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            style={{ position: "relative" }}
          >
            <i className="bx bx-bell" style={{ fontSize: "1.375rem", color: "var(--ez-body)" }} />
            {unreadCount > 0 && (
              <span
                className="badge badge-danger"
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  fontSize: "0.625rem",
                  padding: "0.15rem 0.35rem",
                  borderRadius: "50rem",
                  background: "var(--ez-danger)",
                  color: "#fff"
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <div className={`dropdown-menu ${notifOpen ? "open" : ""}`} style={{ width: "320px", padding: "0.5rem 0", left: "auto", right: 0 }} role="menu">
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--ez-divider)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--ez-primary)", fontSize: "0.75rem", fontWeight: 600, padding: 0 }}>
                  Mark all as read
                </button>
              )}
            </div>

            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "2rem 1rem", textAlign: "center", color: "var(--ez-muted)", fontSize: "0.8125rem" }}>No notifications yet.</div>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom: "1px solid var(--ez-divider)",
                      background: notif.is_read ? "transparent" : "var(--ez-primary-light)",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start"
                    }}
                  >
                    <i className={`bx ${TYPE_ICON[notif.type] || "bx-info-circle"}`} style={{ color: TYPE_COLOR[notif.type] || "var(--ez-primary)", fontSize: "1.25rem", marginTop: "2px" }} />
                    <div style={{ flex: 1 }}>
                      <div className="fw-600 text-xs" style={{ color: "var(--ez-dark)", lineHeight: "1.2" }}>
                        {notif.title}
                      </div>
                      <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.75rem", color: "var(--ez-body)", lineHeight: "1.3" }}>{notif.message}</p>
                      <span style={{ fontSize: "0.65rem", color: "var(--ez-muted)" }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="dropdown" ref={dropRef}>
          <button
            id="userMenuBtn"
            className="btn btn-ghost"
            style={{ gap: "0.625rem", padding: "0.375rem 0.625rem" }}
            onClick={() => setDropOpen((o) => !o)}
            aria-expanded={dropOpen}
            aria-haspopup="true"
          >
            <div className="avatar" style={{ width: 34, height: 34, fontSize: "0.8125rem" }}>
              {initials}
            </div>
            <span className="text-small fw-600 user-menu-name" style={{ color: "var(--ez-dark)" }}>
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </span>
            <i className="bx bx-chevron-down user-menu-chevron" style={{ fontSize: "1rem", color: "var(--ez-muted)" }} />
          </button>

          <div className={`dropdown-menu ${dropOpen ? "open" : ""}`} style={{ left: "auto", right: 0 }} role="menu">
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--ez-divider)" }}>
              <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                {user ? `${user.firstName} ${user.lastName}` : ""}
              </div>
              <div className="text-xs text-muted">{user?.email}</div>
            </div>

            <Link href="/exhibitor-zone/account-settings" className="dropdown-item" role="menuitem" id="profileMenuItem">
              <i className="bx bx-user" />
              Account Settings
            </Link>

            <div className="dropdown-divider" />

            <button
              className="dropdown-item"
              onClick={handleLogout}
              role="menuitem"
              id="logoutMenuItem"
              style={{ width: "100%", background: "none", border: "none", textAlign: "left", color: "var(--ez-danger)" }}
            >
              <i className="bx bx-log-out" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
