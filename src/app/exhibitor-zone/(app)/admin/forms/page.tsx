"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Submission {
  id: number;
  template_name: string;
  company_name: string;
  status: string;
  version: number;
  created_at: string;
}

export default function AdminFormsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [status, setStatus] = useState("submitted");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Refetches whenever the status filter changes, so the loading flag is
    // reset here intentionally (not just on mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    api
      .get<{ submissions: Submission[] }>(`/forms/submissions${status ? `?status=${status}` : ""}`)
      .then((body) => setSubmissions(body.submissions))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load submissions."))
      .finally(() => setLoading(false));
  }, [status]);

  const columns: DataTableColumn<Submission>[] = [
    { key: "template_name", label: "Form" },
    { key: "company_name", label: "Company" },
    { key: "status", label: "Status", render: (s) => <StatusBadge status={s.status} /> },
    { key: "version", label: "Version", render: (s) => `v${s.version}` },
    { key: "created_at", label: "Submitted", render: (s) => formatDate(s.created_at) }
  ];

  return (
    <>
      <div className="content-header d-flex justify-between align-center">
        <div>
          <h1 className="content-title">Form Reviews</h1>
          <p className="content-subtitle">Review exhibitor form submissions and approve or request changes</p>
        </div>
        <select className="form-control form-select" style={{ width: 220 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="needs_info">Needs Info</option>
        </select>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={submissions}
        keyField={(s) => s.id}
        loading={loading}
        searchPlaceholder="Search submissions…"
        emptyMessage="No submissions found."
        actions={(s) => (
          <Link href={`/exhibitor-zone/admin/forms/${s.id}`} className="btn btn-sm btn-ghost">
            Review
          </Link>
        )}
      />
    </>
  );
}
