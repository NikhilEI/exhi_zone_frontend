"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../../_lib/apiClient";
import { formatDate } from "../../../../_lib/format";
import StatusBadge from "../../../../_components/StatusBadge";

interface Submission {
  id: number;
  template_name: string;
  template_slug: string;
  company_name: string;
  status: string;
  version: number;
  created_at: string;
  submitted_by_name: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  hall_no: string | null;
  booth_no: string | null;
  booth_size: string | null;
  data: Record<string, unknown>;
}

function toLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function renderValue(value: unknown, key?: string): React.ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (key && /DocumentId$/.test(key) && (typeof value === "number" || typeof value === "string")) {
    return (
      <a href={api.fileUrl(`/documents/${value}/file`)} target="_blank" rel="noopener noreferrer">
        View / Download <i className="bx bx-link-external" />
      </a>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (isPlainObject(value[0])) {
      const rowKeys = Object.keys(value[0] as Record<string, unknown>);
      return (
        <div className="table-wrapper">
          <table className="table" style={{ margin: 0 }}>
            <thead>
              <tr>
                {rowKeys.map((k) => (
                  <th key={k}>{toLabel(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(value as Record<string, unknown>[]).map((row, i) => (
                <tr key={i}>
                  {rowKeys.map((k) => (
                    <td key={k}>{renderValue(row[k], k)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return value.map((v) => String(v)).join(", ");
  }

  if (isPlainObject(value)) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-xs">
            <strong>{toLabel(k)}:</strong> {renderValue(v, k)}
          </div>
        ))}
      </div>
    );
  }

  return String(value);
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="d-flex" style={{ borderBottom: "1px solid var(--ez-divider)", padding: "0.625rem 0" }}>
      <span className="text-small text-muted" style={{ flex: "0 0 40%" }}>
        {label}
      </span>
      <span className="text-small" style={{ color: "var(--ez-dark)" }}>
        {children}
      </span>
    </div>
  );
}

export default function AdminFormReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);

  useEffect(() => {
    api
      .get<{ submission: Submission }>(`/forms/submissions/${id}`)
      .then((body) => setSubmission(body.submission))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load submission."));
  }, [id]);

  async function review(status: string, reviewerNotes?: string) {
    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/forms/submissions/${id}/status`, { status, reviewerNotes: reviewerNotes || undefined });
      router.push("/exhibitor-zone/admin/forms");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update submission.");
      setSubmitting(false);
    }
  }

  const isBoothDesign = submission?.template_slug === "booth-design-submission";
  const designDocumentId = submission?.data.designDocumentId;

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{isBoothDesign ? "Design Review" : submission?.template_name || "…"}</h1>
        <p className="content-subtitle">Review submitted form data and record a decision</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {submission && isBoothDesign && (
        <div className="grid mb-3" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Design Review</span>
            </div>
            <div className="card-body">
              <FieldRow label="Exhibitor">{submission.company_name}</FieldRow>
              <FieldRow label="Hall">{submission.hall_no || "—"}</FieldRow>
              <FieldRow label="Booth No.">{submission.booth_no || "—"}</FieldRow>
              <FieldRow label="Booth Area">{submission.booth_size ? `${submission.booth_size} sqm` : "—"}</FieldRow>
              <FieldRow label="Contractor">{(submission.data.standContractor as string) || "—"}</FieldRow>
              <FieldRow label="Design Version">V{submission.version}</FieldRow>
              <FieldRow label="Submitted On">{formatDate(submission.created_at)}</FieldRow>
              <FieldRow label="Status">
                <StatusBadge status={submission.status} />
              </FieldRow>
              <FieldRow label="Design File">{designDocumentId ? renderValue(designDocumentId, "designDocumentId") : "—"}</FieldRow>
              <FieldRow label="Reviewer">{submission.reviewer_name || "—"}</FieldRow>
              <FieldRow label="Review Date">{submission.reviewed_at ? formatDate(submission.reviewed_at) : "—"}</FieldRow>
              <FieldRow label="Comments">{submission.reviewer_notes || "—"}</FieldRow>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Decision</span>
            </div>
            <div className="card-body">
              {!requestingChanges ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button type="button" className="btn btn-success" disabled={submitting} onClick={() => review("approved")}>
                    Approve
                  </button>
                  <button type="button" className="btn btn-warning" disabled={submitting} onClick={() => setRequestingChanges(true)}>
                    Changes Required
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Comments</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder="Describe the changes required…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <button type="button" className="btn btn-warning" disabled={submitting || !notes.trim()} onClick={() => review("changes_requested", notes)}>
                      Submit Changes Required
                    </button>
                    <button type="button" className="btn btn-ghost" disabled={submitting} onClick={() => setRequestingChanges(false)}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {submission && !isBoothDesign && (
        <div className="grid mb-3" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <div>
                <span className="card-title">{submission.company_name}</span>
                <div className="text-xs text-muted mt-1">
                  Version {submission.version} · Submitted {formatDate(submission.created_at)}
                  {submission.submitted_by_name && <> by {submission.submitted_by_name}</>}
                </div>
              </div>
              <StatusBadge status={submission.status} />
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column" }}>
                {Object.entries(submission.data).map(([key, value]) => {
                  const isComplex = Array.isArray(value) || isPlainObject(value);
                  return (
                    <div
                      key={key}
                      style={{ borderBottom: "1px solid var(--ez-divider)", padding: "0.625rem 0" }}
                      className={isComplex ? undefined : "d-flex"}
                    >
                      <span className="text-small text-muted" style={isComplex ? { display: "block", marginBottom: "0.5rem" } : { flex: "0 0 40%" }}>
                        {toLabel(key)}
                      </span>
                      <span className="text-small" style={{ color: "var(--ez-dark)" }}>
                        {renderValue(value, key)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Review</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button type="button" className="btn btn-success" disabled={submitting} onClick={() => review("approved", notes)}>
                  Approve
                </button>
                <button type="button" className="btn btn-warning" disabled={submitting} onClick={() => review("changes_requested", notes)}>
                  Request Changes
                </button>
                <button type="button" className="btn btn-danger" disabled={submitting} onClick={() => review("rejected", notes)}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Link href="/exhibitor-zone/admin/forms" className="btn btn-outline-primary">
        <i className="bx bx-chevron-left" /> Back to Reviews
      </Link>
    </>
  );
}
