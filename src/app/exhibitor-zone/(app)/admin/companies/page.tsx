"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Profile {
  id: number;
  legal_name: string;
  display_name: string;
  company_email: string;
  profile_status: string;
  created_at: string;
}

function CompaniesList() {
  const statusParam = useSearchParams().get("status") || "";
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [status, setStatus] = useState(statusParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load(filterStatus: string) {
    setLoading(true);
    api
      .get<{ profiles: Profile[] }>(`/exhibitors${filterStatus ? `?status=${filterStatus}` : ""}`)
      .then((body) => setProfiles(body.profiles))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load exhibitors."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => load(status), [status]);

  async function updateStatus(id: number, newStatus: string) {
    setMessage("");
    setError("");
    try {
      const rejectionReason = newStatus === "rejected" ? prompt("Rejection reason (optional):") || undefined : undefined;
      await api.patch(`/exhibitors/profiles/${id}/status`, { status: newStatus, rejectionReason });
      setMessage(`Profile marked as ${newStatus}.`);
      load(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status.");
    }
  }

  const columns: DataTableColumn<Profile>[] = [
    {
      key: "display_name",
      label: "Company",
      render: (p) => (
        <>
          <Link href={`/exhibitor-zone/admin/companies/${p.id}`} className="fw-600">{p.display_name}</Link>
          <div>
            <small className="text-xs text-muted">{p.legal_name}</small>
          </div>
        </>
      )
    },
    { key: "company_email", label: "Email" },
    { key: "profile_status", label: "Status", render: (p) => <StatusBadge status={p.profile_status} /> },
    { key: "created_at", label: "Registered", render: (p) => formatDate(p.created_at) }
  ];

  return (
    <>
      <div className="content-header d-flex justify-between align-center">
        <div>
          <h1 className="content-title">Exhibitors</h1>
          <p className="content-subtitle">Review registrations and manage exhibitor account status</p>
        </div>
        <select className="form-control form-select" style={{ width: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={profiles}
        keyField={(p) => p.id}
        loading={loading}
        searchPlaceholder="Search exhibitors…"
        emptyMessage="No exhibitors found."
        actions={(p) => (
          <>
            {p.profile_status === "pending" && (
              <div className="d-flex gap-1">
                <button type="button" className="btn btn-sm btn-success" onClick={() => updateStatus(p.id, "approved")}>
                  Approve
                </button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => updateStatus(p.id, "rejected")}>
                  Reject
                </button>
              </div>
            )}
            {p.profile_status === "approved" && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => updateStatus(p.id, "suspended")}>
                Suspend
              </button>
            )}
            {p.profile_status === "suspended" && (
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => updateStatus(p.id, "approved")}>
                Reinstate
              </button>
            )}
          </>
        )}
      />
    </>
  );
}

export default function AdminCompaniesPage() {
  return (
    <Suspense fallback={null}>
      <CompaniesList />
    </Suspense>
  );
}
