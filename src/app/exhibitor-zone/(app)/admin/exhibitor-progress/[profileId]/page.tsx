"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "../../../../_lib/apiClient";
import { formatDate } from "../../../../_lib/format";
import StatusBadge from "../../../../_components/StatusBadge";

interface MandatoryForm {
  id: number;
  form_key: string;
  name: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  completed_at: string | null;
}

const STATUS_ICON: Record<MandatoryForm["status"], string> = {
  pending: "bx-circle",
  in_progress: "bx-time-five",
  completed: "bx-check-circle"
};

export default function AdminExhibitorProgressDetailPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const companyName = useSearchParams().get("company") || "";
  const [forms, setForms] = useState<MandatoryForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ forms: MandatoryForm[] }>(`/mandatory-forms/status/${profileId}`)
      .then((body) => setForms(body.forms))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load form progress."))
      .finally(() => setLoading(false));
  }, [profileId]);

  const completedCount = forms.filter((f) => f.status === "completed").length;

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{companyName || "Exhibitor"} — Mandatory Forms</h1>
        <p className="content-subtitle">Form-by-form completion status for this exhibitor</p>
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
            {forms.map((form, index) => (
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
                      <i
                        className={`bx ${STATUS_ICON[form.status]}`}
                        style={{ fontSize: "1.25rem", color: form.status === "completed" ? "var(--ez-success)" : "var(--ez-muted)" }}
                      />
                    </div>
                    <div>
                      <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                        {index + 1}. {form.name}
                      </div>
                      {form.description && <div className="text-xs text-muted">{form.description}</div>}
                      {form.completed_at && <div className="text-xs text-muted">Completed {formatDate(form.completed_at)}</div>}
                    </div>
                  </div>
                  <StatusBadge status={form.status} />
                </div>
              </div>
            ))}

            {forms.length === 0 && <div className="card text-center text-muted text-small" style={{ padding: "2rem" }}>No mandatory forms apply to this exhibitor yet.</div>}
          </div>
        </>
      )}

      <Link href="/exhibitor-zone/admin/exhibitor-progress" className="btn btn-ghost mt-3">
        <i className="bx bx-chevron-left" /> Back to Exhibitor Progress
      </Link>
    </>
  );
}
