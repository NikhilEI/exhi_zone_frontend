"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../_lib/apiClient";
import { formatDate } from "../../_lib/format";

interface MandatoryForm {
  id: number;
  form_key: string;
  name: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
}

const TOTAL_PLANNED_FORMS = 5;

const STATUS_META: Record<MandatoryForm["status"], { label: string; badge: string; icon: string }> = {
  pending: { label: "Required", badge: "badge-warning", icon: "bx-circle" },
  in_progress: { label: "In Progress", badge: "badge-info", icon: "bx-time-five" },
  completed: { label: "Completed", badge: "badge-success", icon: "bx-check-circle" }
};

export default function MandatoryFormsPage() {
  const [forms, setForms] = useState<MandatoryForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ forms: MandatoryForm[] }>("/mandatory-forms")
      .then((body) => setForms(body.forms))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load mandatory forms."))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = forms.filter((f) => f.status === "completed").length;

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Mandatory Forms</h1>
        <p className="content-subtitle">These forms are mandatory and must be completed before you can proceed to the next stage.</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="card mb-3" style={{ padding: "1.5rem" }}>
            <div className="d-flex justify-between align-center mb-1">
              <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                Overall Completion
              </span>
              <span className="fw-700" style={{ color: "var(--ez-primary)" }}>
                {completedCount} of {forms.length} Completed
              </span>
            </div>
            <div className="progress">
              <div className="progress-bar" style={{ width: `${forms.length > 0 ? (completedCount / forms.length) * 100 : 0}%` }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {forms.map((form, index) => {
              const meta = STATUS_META[form.status];
              return (
                <div key={form.id} className="card" style={{ padding: "1.25rem 1.5rem" }}>
                  <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
                    <div className="d-flex align-center gap-2">
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: form.status === "completed" ? "var(--ez-success-light)" : "var(--ez-bg-body)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0
                        }}
                      >
                        <i className={`bx ${meta.icon}`} style={{ fontSize: "1.25rem", color: form.status === "completed" ? "var(--ez-success)" : "var(--ez-muted)" }} />
                      </div>
                      <div>
                        <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                          {index + 1}. {form.name}
                        </div>
                        {form.description && <div className="text-xs text-muted">{form.description}</div>}
                        {form.completed_at && <div className="text-xs text-muted">Completed {formatDate(form.completed_at)}</div>}
                      </div>
                    </div>
                    <div className="d-flex align-center gap-2">
                      <span className={`badge ${meta.badge}`}>{meta.label}</span>
                      <Link href={`/exhibitor-zone/mandatory-forms/${form.form_key}`} className={`btn btn-sm ${form.status === "completed" ? "btn-outline-primary" : "btn-primary"}`}>
                        {form.status === "completed" ? "Edit" : "Continue"}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

            {forms.length < TOTAL_PLANNED_FORMS && (
              <div className="card" style={{ padding: "1.25rem 1.5rem", opacity: 0.6 }}>
                <div className="d-flex align-center gap-2">
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ez-bg-body)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className="bx bx-circle" style={{ fontSize: "1.25rem", color: "var(--ez-muted)" }} />
                  </div>
                  <div>
                    <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                      {forms.length + 1}. Remaining Mandatory Forms
                    </div>
                    <div className="text-xs text-muted">
                      {TOTAL_PLANNED_FORMS - forms.length} more mandatory form{TOTAL_PLANNED_FORMS - forms.length === 1 ? "" : "s"} will appear here as {TOTAL_PLANNED_FORMS - forms.length === 1 ? "it is" : "they are"} published.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
