"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../_lib/apiClient";
import { formatDate } from "../../../../_lib/format";
import StatusBadge from "../../../../_components/StatusBadge";

interface Profile {
  id: number;
  company_id: number;
  legal_name: string;
  display_name: string;
  company_type: string | null;
  industry_type: string | null;
  website: string | null;
  address_line1: string;
  city: string;
  country: string;
  email: string | null;
  phone: string | null;
  profile_status: string;
  rejection_reason: string | null;
  is_verified: number;
}

interface EditForm {
  legalName: string;
  displayName: string;
  industryType: string;
  website: string;
  addressLine1: string;
  city: string;
  country: string;
  email: string;
  phone: string;
}

function toEditForm(profile: Profile): EditForm {
  return {
    legalName: profile.legal_name || "",
    displayName: profile.display_name || "",
    industryType: profile.industry_type || "",
    website: profile.website || "",
    addressLine1: profile.address_line1 || "",
    city: profile.city || "",
    country: profile.country || "",
    email: profile.email || "",
    phone: profile.phone || ""
  };
}

interface Document {
  id: number;
  document_type: string;
  original_filename: string;
  is_verified: number;
}

export default function AdminCompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    api
      .get<{ profile: Profile }>(`/exhibitors/${id}`)
      .then((body) => {
        setProfile(body.profile);
        return api.get<{ documents: Document[] }>(`/documents?exhibitorProfileId=${id}`);
      })
      .then((body) => setDocuments(body.documents))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load company."));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [id]);

  function startEditing() {
    if (!profile) return;
    setEditForm(toEditForm(profile));
    setMessage("");
    setError("");
    setEditing(true);
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!profile || !editForm) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.patch(`/exhibitors/companies/${profile.company_id}`, {
        legalName: editForm.legalName,
        displayName: editForm.displayName,
        industryType: editForm.industryType || undefined,
        website: editForm.website || undefined,
        addressLine1: editForm.addressLine1,
        city: editForm.city,
        country: editForm.country,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined
      });
      setMessage("Company details updated.");
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{profile?.display_name || "…"}</h1>
        <p className="content-subtitle">Exhibitor company details and uploaded documents</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {profile && (
        <div className="grid mb-3" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Company Details</span>
              <div className="d-flex align-center gap-2">
                <StatusBadge status={profile.profile_status} />
                {!editing && (
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={startEditing}>
                    Edit
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {editing && editForm ? (
                <>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Legal Name</label>
                      <input className="form-control" value={editForm.legalName} onChange={(e) => setField("legalName", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Display Name</label>
                      <input className="form-control" value={editForm.displayName} onChange={(e) => setField("displayName", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Industry</label>
                      <input className="form-control" value={editForm.industryType} onChange={(e) => setField("industryType", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Website</label>
                      <input className="form-control" value={editForm.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://example.com" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-control" value={editForm.addressLine1} onChange={(e) => setField("addressLine1", e.target.value)} />
                  </div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input className="form-control" value={editForm.city} onChange={(e) => setField("city", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input className="form-control" value={editForm.country} onChange={(e) => setField("country", e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={editForm.email} onChange={(e) => setField("email", e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="form-control" value={editForm.phone} onChange={(e) => setField("phone", e.target.value)} />
                    </div>
                  </div>
                  <div className="d-flex justify-end gap-2" style={{ marginTop: "0.5rem" }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {[
                    ["Legal Name", profile.legal_name],
                    ["Type", profile.company_type || "—"],
                    ["Industry", profile.industry_type || "—"],
                    ["Website", profile.website || "—"],
                    ["Address", `${profile.address_line1}, ${profile.city}, ${profile.country}`],
                    ["Email", profile.email || "—"],
                    ["Phone", profile.phone || "—"]
                  ].map(([label, value]) => (
                    <div key={label} className="d-flex justify-between" style={{ borderBottom: "1px solid var(--ez-divider)", paddingBottom: "0.875rem" }}>
                      <span className="text-small text-muted">{label}</span>
                      <span className="fw-600 text-small" style={{ color: "var(--ez-dark)", textAlign: "right" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                  {profile.rejection_reason && (
                    <div className="d-flex justify-between">
                      <span className="text-small text-muted">Rejection Reason</span>
                      <span className="fw-600 text-small" style={{ color: "var(--ez-danger)", textAlign: "right" }}>
                        {profile.rejection_reason}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Documents</span>
            </div>
            {documents.length === 0 ? (
              <div className="card-body">
                <p className="text-muted text-small mb-0">No documents uploaded.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="d-flex justify-between align-center"
                    style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--ez-divider)" }}
                  >
                    <a href={api.fileUrl(`/documents/${d.id}/file`)} target="_blank" rel="noreferrer" className="text-small">
                      {d.document_type.replace(/_/g, " ")}
                    </a>
                    {d.is_verified ? <span className="badge badge-success">Verified</span> : <span className="badge badge-secondary">Pending</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Link href="/exhibitor-zone/admin/companies" className="btn btn-outline-primary">
        <i className="bx bx-chevron-left" /> Back to Exhibitors
      </Link>
    </>
  );
}
