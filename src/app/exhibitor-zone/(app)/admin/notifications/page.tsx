"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, ApiError } from "../../../_lib/apiClient";

interface Profile {
  id: number;
  company_id: number;
  legal_name: string;
  display_name: string;
  company_email: string;
  profile_status: string;
}

const TYPE_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" }
] as const;

export default function AdminNotificationsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [target, setTarget] = useState<"all" | "companies">("all");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]["value"]>("info");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .get<{ profiles: Profile[] }>("/exhibitors")
      .then((body) => setProfiles(body.profiles))
      .catch((err) => setApiError(err instanceof ApiError ? err.message : "Failed to load exhibitor list."))
      .finally(() => setLoadingProfiles(false));
  }, []);

  function toggleCompany(companyId: number) {
    setSelectedCompanyIds((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId);
      else next.add(companyId);
      return next;
    });
  }

  const recipientCount = useMemo(() => {
    if (target === "all") return profiles.length;
    return profiles.filter((p) => selectedCompanyIds.has(p.company_id)).length;
  }, [target, selectedCompanyIds, profiles]);

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required.";
    if (!message.trim()) next.message = "Message is required.";
    if (target === "companies" && selectedCompanyIds.size === 0) next.companyIds = "Select at least one exhibitor.";
    return next;
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSending(true);
    try {
      const body = await api.post<{ recipientCount: number }>("/admin/notifications/send", {
        target,
        companyIds: target === "companies" ? Array.from(selectedCompanyIds) : undefined,
        title: title.trim(),
        message: message.trim(),
        type
      });
      setSuccessMessage(`Notification sent to ${body.recipientCount} exhibitor account${body.recipientCount === 1 ? "" : "s"}.`);
      setTitle("");
      setMessage("");
      setSelectedCompanyIds(new Set());
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to send notification.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Send Notification</h1>
        <p className="content-subtitle">Broadcast an in-app notification to all exhibitors, or target specific companies</p>
      </div>

      {successMessage && <div className="alert alert-success mb-3">{successMessage}</div>}
      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start", gap: "1.5rem" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Compose</span>
          </div>
          <div className="card-body">
            <form noValidate onSubmit={handleSend}>
              <div className="form-group">
                <label className="form-label">
                  Send To <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <div className="d-flex gap-3">
                  <label className="d-flex align-center gap-1" style={{ cursor: "pointer" }}>
                    <input type="radio" name="target" checked={target === "all"} onChange={() => setTarget("all")} />
                    <span className="text-small">All Exhibitors</span>
                  </label>
                  <label className="d-flex align-center gap-1" style={{ cursor: "pointer" }}>
                    <input type="radio" name="target" checked={target === "companies"} onChange={() => setTarget("companies")} />
                    <span className="text-small">Specific Exhibitors</span>
                  </label>
                </div>
              </div>

              {target === "companies" && (
                <div className="form-group">
                  <label className="form-label">Select Exhibitors</label>
                  {loadingProfiles ? (
                    <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                  ) : (
                    <div
                      style={{
                        border: "1px solid var(--ez-border)",
                        borderRadius: "var(--ez-border-radius)",
                        maxHeight: 220,
                        overflowY: "auto",
                        padding: "0.5rem 0.75rem"
                      }}
                    >
                      {profiles.length === 0 ? (
                        <p className="text-muted text-small mb-0">No exhibitors found.</p>
                      ) : (
                        profiles.map((p) => (
                          <label key={p.id} className="d-flex align-center gap-2" style={{ padding: "0.375rem 0", cursor: "pointer" }}>
                            <input type="checkbox" checked={selectedCompanyIds.has(p.company_id)} onChange={() => toggleCompany(p.company_id)} />
                            <span className="text-small">{p.display_name}</span>
                            <span className="text-xs text-muted">{p.company_email}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                  {errors.companyIds && <div className="invalid-feedback d-block">{errors.companyIds}</div>}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Title <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input
                  className={`form-control ${errors.title ? "is-invalid" : ""}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Message <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <textarea
                  className={`form-control ${errors.message ? "is-invalid" : ""}`}
                  rows={4}
                  maxLength={2000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                {errors.message && <div className="invalid-feedback d-block">{errors.message}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control form-select" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-flex justify-between align-center" style={{ marginTop: "1rem" }}>
                <span className="text-small text-muted">
                  Will notify <strong>{recipientCount}</strong> exhibitor account{recipientCount === 1 ? "" : "s"}
                </span>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Preview</span>
          </div>
          <div className="card-body">
            <div className={`alert alert-${type === "error" ? "danger" : type} mb-0`}>
              <span className="fw-600">{title || "Notification title"}</span>
              <div className="text-small mt-1">{message || "Your message will appear here."}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
