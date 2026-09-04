"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../_lib/apiClient";
import { formatDateTime } from "../../../../_lib/format";

interface Registration {
  id: number;
  first_name: string;
  last_name: string;
  organisation: string;
  designation: string | null;
  email: string;
  learn_about_expo: string;
  city: string;
  country: string;
  mobile_no: string;
  shell_space: string | null;
  business_intrest: string | null;
  created_at: string;
  exhibitor_profile_id: number | null;
  converted_at: string | null;
  company_name: string | null;
  profile_status: string | null;
}

export default function AdminRegistrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reg, setReg] = useState<Registration | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [converting, setConverting] = useState(false);

  function load() {
    api
      .get<{ registration: Registration }>(`/admin/registrations/${id}`)
      .then((body) => setReg(body.registration))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load registration."));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [id]);

  async function handleConvert() {
    if (!reg) return;
    const confirmed = window.confirm(
      `Convert "${reg.organisation}" (${reg.email}) into an exhibitor account? This creates a real login, assigns a default pass, and emails them a set-password link.`
    );
    if (!confirmed) return;

    setConverting(true);
    setError("");
    setMessage("");
    try {
      await api.post(`/admin/registrations/${id}/convert`);
      setMessage(`${reg.organisation} converted to an exhibitor account.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to convert this registration.");
    } finally {
      setConverting(false);
    }
  }

  const eligibilityFields: [string, string | null][] = reg
    ? [
        ["Designation", reg.designation],
        ["How they heard about the expo", reg.learn_about_expo],
        ["Shell space requirement", reg.shell_space],
        ["Business interest", reg.business_intrest]
      ]
    : [];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{reg?.organisation || "…"}</h1>
        <p className="content-subtitle">Space-booking enquiry details, reviewed here before converting to an exhibitor account</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {reg && (
        <div className="grid mb-3" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Contact &amp; Company</span>
              {reg.converted_at ? <span className="badge badge-success">Converted</span> : <span className="badge badge-warning">New</span>}
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {[
                  ["Contact Name", `${reg.first_name} ${reg.last_name}`],
                  ["Organisation", reg.organisation],
                  ["Email", reg.email],
                  ["Mobile", reg.mobile_no],
                  ["Location", `${reg.city}, ${reg.country}`],
                  ["Submitted", formatDateTime(reg.created_at)]
                ].map(([label, value]) => (
                  <div key={label} className="d-flex justify-between" style={{ borderBottom: "1px solid var(--ez-divider)", paddingBottom: "0.875rem" }}>
                    <span className="text-small text-muted">{label}</span>
                    <span className="fw-600 text-small" style={{ color: "var(--ez-dark)", textAlign: "right" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Eligibility Details</span>
            </div>
            <div className="card-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {eligibilityFields.map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-muted mb-1">{label}</div>
                    <div className="text-small" style={{ color: "var(--ez-dark)" }}>
                      {value && value.trim() ? value : "—"}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                {reg.converted_at ? (
                  <Link href={`/exhibitor-zone/admin/companies/${reg.exhibitor_profile_id}`} className="btn btn-outline-primary w-100">
                    View Exhibitor Profile
                  </Link>
                ) : (
                  <button type="button" className="btn btn-primary w-100" onClick={handleConvert} disabled={converting}>
                    {converting ? "Converting..." : "Convert to Exhibitor"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Link href="/exhibitor-zone/admin/registrations" className="btn btn-outline-primary">
        <i className="bx bx-chevron-left" /> Back to Registrations
      </Link>
    </>
  );
}
