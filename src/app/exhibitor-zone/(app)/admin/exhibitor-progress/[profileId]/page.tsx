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
  applicable: boolean;
}

interface FormDefinition {
  id: number;
  form_key: string;
  name: string;
  description: string | null;
  is_active: number;
}

const STATUS_ICON: Record<MandatoryForm["status"], string> = {
  pending: "bx-circle",
  in_progress: "bx-time-five",
  completed: "bx-check-circle"
};

// Booth Design Submission and Fascia Name Submission are mutually exclusive —
// which one applies depends on booth_type (Raw Space vs Shell Space). Once
// booth_type is known, exactly one of the two should show, exactly like the
// exhibitor's own Mandatory Forms list.
const BOOTH_TYPE_PAIR = ["booth-design-submission", "fascia-name-submission"];

export default function AdminExhibitorProgressDetailPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const companyName = useSearchParams().get("company") || "";
  const [forms, setForms] = useState<MandatoryForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // /status/:profileId only returns forms currently applicable to this
    // exhibitor (e.g. Booth Design only shows once booth_type is known to be
    // Raw Space) — merged here with the full definition list so an admin can
    // still open and fill in a form that isn't "applicable" yet, rather than
    // being blocked from ever setting it up in the first place.
    Promise.all([
      api.get<{ forms: Omit<MandatoryForm, "applicable">[] }>(`/mandatory-forms/status/${profileId}`),
      api.get<{ definitions: FormDefinition[] }>("/mandatory-forms/admin/definitions")
    ])
      .then(([statusBody, defsBody]) => {
        const byKey = new Map(statusBody.forms.map((f) => [f.form_key, f]));
        const merged: MandatoryForm[] = defsBody.definitions
          .filter((d) => d.is_active)
          .filter((d) => {
            // Booth type is known (one of the pair is already applicable) —
            // drop the other one entirely instead of showing both.
            if (BOOTH_TYPE_PAIR.includes(d.form_key) && !byKey.has(d.form_key)) {
              const counterpart = BOOTH_TYPE_PAIR.find((k) => k !== d.form_key);
              if (counterpart && byKey.has(counterpart)) return false;
            }
            return true;
          })
          .map((d) => {
            const known = byKey.get(d.form_key);
            return known
              ? { ...known, applicable: true }
              : { id: d.id, form_key: d.form_key, name: d.name, description: d.description, status: "pending", completed_at: null, applicable: false };
          });
        setForms(merged);
      })
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
                      {!form.applicable && (
                        <div className="text-xs text-muted">Not yet applicable (booth type not set) — you can still fill it in as admin.</div>
                      )}
                    </div>
                  </div>
                  <div className="d-flex align-center gap-2">
                    <StatusBadge status={form.status} />
                    <Link
                      href={`/exhibitor-zone/mandatory-forms/${form.form_key}?profileId=${profileId}&company=${encodeURIComponent(companyName)}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      {form.status === "completed" ? "Edit" : "Fill In"}
                    </Link>
                  </div>
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
