"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../_lib/apiClient";
import { timeAgo } from "../../_lib/format";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: number;
  created_at: string;
}

const ICON_MAP: Record<string, { icon: string; color: string }> = {
  info: { icon: "bx-info-circle", color: "var(--ez-info)" },
  success: { icon: "bx-check-circle", color: "var(--ez-success)" },
  warning: { icon: "bx-error", color: "var(--ez-warning)" },
  error: { icon: "bx-x-circle", color: "var(--ez-danger)" }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");

  function load() {
    api
      .get<{ notifications: Notification[] }>("/notifications?pageSize=50")
      .then((body) => setNotifications(body.notifications))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load notifications."));
  }

  useEffect(load, []);

  async function markRead(id: number) {
    await api.patch(`/notifications/${id}/read`);
    load();
  }

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    load();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="content-header d-flex justify-between align-center">
        <div>
          <h1 className="content-title">Notifications</h1>
          <p className="content-subtitle">Stay updated on approvals, reminders, and account activity</p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={markAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {notifications.length === 0 ? (
        <div className="card" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
          <i className="bx bx-bell-off" style={{ fontSize: "3rem", color: "var(--ez-muted)" }} />
          <h3 style={{ color: "var(--ez-dark)", marginTop: "0.75rem", marginBottom: "0.25rem" }}>No notifications</h3>
          <p className="text-muted text-small mb-0">You are all caught up.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {notifications.map((n) => {
            const tokens = ICON_MAP[n.type] || ICON_MAP.info;
            return (
              <div
                key={n.id}
                className="card"
                onClick={() => !n.is_read && markRead(n.id)}
                style={{
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  cursor: n.is_read ? "default" : "pointer",
                  background: n.is_read ? "var(--ez-bg-card)" : "var(--ez-primary-light)"
                }}
              >
                <i className={`bx ${tokens.icon}`} style={{ fontSize: "1.375rem", color: tokens.color, flexShrink: 0, marginTop: "0.125rem" }} />
                <div style={{ flex: 1 }}>
                  <div className="d-flex justify-between align-center">
                    <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                      {n.title}
                    </span>
                    <span className="text-xs text-muted">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="text-small text-muted mt-1" style={{ margin: 0 }}>
                    {n.message}
                  </p>
                </div>
                {!n.is_read && <span className="badge badge-primary">New</span>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
