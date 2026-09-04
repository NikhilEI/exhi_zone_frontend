"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDate } from "../../../_lib/format";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Registration {
  id: number;
  first_name: string;
  last_name: string;
  organisation: string;
  email: string;
  mobile_no: string;
  city: string;
  country: string;
  created_at: string;
  exhibitor_profile_id: number | null;
  converted_at: string | null;
  company_name: string | null;
}

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [convertingId, setConvertingId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    api
      .get<{ registrations: Registration[] }>("/admin/registrations")
      .then((body) => setRegistrations(body.registrations))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load registrations."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  async function handleConvert(reg: Registration) {
    const confirmed = window.confirm(
      `Convert "${reg.organisation}" (${reg.email}) into an exhibitor account? This creates a real login, assigns a default pass, and emails them a set-password link.`
    );
    if (!confirmed) return;

    setConvertingId(reg.id);
    setError("");
    setMessage("");
    try {
      await api.post(`/admin/registrations/${reg.id}/convert`);
      setMessage(`${reg.organisation} converted to an exhibitor account.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to convert this registration.");
    } finally {
      setConvertingId(null);
    }
  }

  const columns: DataTableColumn<Registration>[] = [
    {
      key: "organisation",
      label: "Organisation",
      render: (r) => (
        <>
          <Link href={`/exhibitor-zone/admin/registrations/${r.id}`} className="fw-600 text-small">
            {r.organisation}
          </Link>
          <div className="text-xs text-muted">
            {r.first_name} {r.last_name}
          </div>
        </>
      )
    },
    { key: "email", label: "Email" },
    { key: "mobile_no", label: "Mobile" },
    { key: "city", label: "Location", render: (r) => `${r.city}, ${r.country}` },
    { key: "created_at", label: "Submitted", render: (r) => formatDate(r.created_at) },
    {
      key: "converted_at",
      label: "Status",
      render: (r) =>
        r.converted_at ? (
          <Link href={`/exhibitor-zone/admin/companies/${r.exhibitor_profile_id}`} className="badge badge-success">
            Converted
          </Link>
        ) : (
          <span className="badge badge-warning">New</span>
        )
    }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Registrations</h1>
        <p className="content-subtitle">Space-booking enquiries from the marketing site — convert qualified leads into exhibitor accounts</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={registrations}
        keyField={(r) => r.id}
        loading={loading}
        searchPlaceholder="Search registrations…"
        emptyMessage="No space-booking enquiries yet."
        actions={(r) => (
          <div className="d-flex gap-1">
            <Link href={`/exhibitor-zone/admin/registrations/${r.id}`} className="btn btn-sm btn-ghost">
              View
            </Link>
            {r.converted_at ? (
              <Link href={`/exhibitor-zone/admin/companies/${r.exhibitor_profile_id}`} className="btn btn-sm btn-outline-primary">
                View Exhibitor
              </Link>
            ) : (
              <button type="button" className="btn btn-sm btn-primary" onClick={() => handleConvert(r)} disabled={convertingId === r.id}>
                {convertingId === r.id ? "Converting..." : "Convert to Exhibitor"}
              </button>
            )}
          </div>
        )}
      />
    </>
  );
}
