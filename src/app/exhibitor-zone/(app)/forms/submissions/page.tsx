"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";

interface Submission {
  id: number;
  template_name: string;
  status: string;
  version: number;
  reviewer_notes: string | null;
  created_at: string;
}

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ submissions: Submission[] }>("/forms/submissions")
      .then((body) => setSubmissions(body.submissions))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load submissions."));
  }, []);

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">My Submissions</h1>
        <p className="content-subtitle">Track the status and review history of every form you have submitted</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Form</th>
                <th>Status</th>
                <th>Version</th>
                <th>Submitted</th>
                <th>Reviewer Notes</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted text-small" style={{ textAlign: "center", padding: "2rem" }}>
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                submissions.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                      {s.template_name}
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="text-small">v{s.version}</td>
                    <td className="text-small">{formatDate(s.created_at)}</td>
                    <td className="text-small text-muted">{s.reviewer_notes || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Link href="/exhibitor-zone/forms" className="btn btn-ghost">
        <i className="bx bx-chevron-left" /> Back to Forms
      </Link>
    </>
  );
}
