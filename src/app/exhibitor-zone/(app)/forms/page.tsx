"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../_lib/apiClient";

interface Template {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  deadline: string | null;
  requires_approval: boolean | number;
}

interface Submission {
  id: number;
  form_template_id: number;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
  reviewer_notes: string | null;
}

function getStatusBadge(status?: string) {
  if (!status) return <span className="badge badge-secondary">Not Started</span>;
  switch (status) {
    case "approved":
      return <span className="badge badge-success">Approved</span>;
    case "submitted":
      return <span className="badge badge-warning">Submitted</span>;
    case "changes_requested":
      return <span className="badge badge-danger">Changes Requested</span>;
    case "rejected":
      return <span className="badge badge-danger">Rejected</span>;
    case "draft":
    default:
      return <span className="badge badge-info">Draft Saved</span>;
  }
}

function getActionText(status?: string) {
  if (!status) return "Start Form";
  if (status === "draft") return "Edit Draft";
  if (status === "changes_requested") return "Revise Details";
  return "View Submission";
}

export default function FormsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get<{ mandatory: Template[]; additional: Template[] }>("/forms/templates"), api.get<{ submissions: Submission[] }>("/forms/submissions")])
      .then(([templatesRes, submissionsRes]) => {
        setTemplates([...templatesRes.mandatory, ...templatesRes.additional]);
        setSubmissions(submissionsRes.submissions);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load forms."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  const completedCount = submissions.filter((s) => s.status === "approved").length;

  return (
    <>
      <div className="content-header d-flex justify-between align-center">
        <div>
          <h1 className="content-title">Mandatory Compliance Forms</h1>
          <p className="content-subtitle">Please complete all event listing, compliance guidelines, and badge registrations before setup start</p>
        </div>
        <Link href="/exhibitor-zone/forms/submissions" className="btn btn-outline-primary btn-sm">
          My Submissions
        </Link>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3" style={{ padding: "1.5rem" }}>
        <div className="d-flex justify-between align-center mb-1">
          <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
            Overall Forms Completion
          </span>
          <span className="fw-700" style={{ color: "var(--ez-primary)" }}>
            {completedCount} of {templates.length} Approved
          </span>
        </div>
        <div className="progress">
          <div className="progress-bar" style={{ width: `${templates.length > 0 ? (completedCount / templates.length) * 100 : 0}%` }} />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {templates.map((temp) => {
          const sub = submissions.find((s) => s.form_template_id === temp.id);

          return (
            <div key={temp.id} className="card" style={{ padding: "1.5rem" }}>
              <div className="d-flex justify-between align-center mb-2" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--ez-dark)", margin: 0 }}>{temp.name}</h3>
                <div className="d-flex gap-1 align-center">
                  {getStatusBadge(sub?.status)}
                  {temp.deadline && (
                    <span className="text-xs text-muted" style={{ marginLeft: "0.5rem" }}>
                      Due: {new Date(temp.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {temp.description && (
                <p className="text-muted text-small mb-3" style={{ maxWidth: "750px" }}>
                  {temp.description}
                </p>
              )}

              {sub?.reviewer_notes && (
                <div className="alert alert-danger mb-3" style={{ padding: "0.75rem 1rem" }}>
                  <i className="bx bx-comment-error" style={{ fontSize: "1.125rem" }} />
                  <div>
                    <span className="fw-600 text-small">Reviewer Feedback:</span>
                    <p className="text-xs mt-1" style={{ margin: 0 }}>
                      {sub.reviewer_notes}
                    </p>
                  </div>
                </div>
              )}

              <div className="d-flex justify-between align-center">
                <span className="text-xs text-muted">{temp.requires_approval ? "Requires Organiser Review" : "Auto-registered on submission"}</span>
                <Link href={`/exhibitor-zone/forms/${temp.slug}`} className={`btn ${sub ? "btn-outline-primary" : "btn-primary"} btn-sm`}>
                  {getActionText(sub?.status)}
                </Link>
              </div>
            </div>
          );
        })}
        {templates.length === 0 && <p className="text-muted text-small">No forms configured yet.</p>}
      </div>
    </>
  );
}
