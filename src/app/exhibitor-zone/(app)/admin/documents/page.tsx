"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDate } from "../../../_lib/format";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Profile {
  id: number;
  display_name: string;
  legal_name: string;
  company_email: string | null;
  profile_status: string;
}

interface Document {
  id: number;
  document_type: string;
  original_filename: string;
  file_size_bytes: number;
  created_at: string;
}

const DOC_TYPES = [
  { value: "proforma_invoice", label: "Performa Invoice" },
  { value: "invoice", label: "Invoice" },
  { value: "letter_of_participation", label: "Letter of Participation" },
  { value: "certificate_of_incorporation", label: "Certificate of Incorporation" }
];

function AdminDocumentsPageInner() {
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<{ profiles: Profile[] }>("/exhibitors")
      .then((body) => {
        setProfiles(body.profiles);
        const preselectId = searchParams.get("exhibitorProfileId");
        if (preselectId) {
          const match = body.profiles.find((p) => String(p.id) === preselectId);
          if (match) selectProfile(match);
        }
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load exhibitors."))
      .finally(() => setLoadingProfiles(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadDocuments(profileId: number) {
    setLoadingDocs(true);
    api
      .get<{ documents: Document[] }>(`/documents?exhibitorProfileId=${profileId}`)
      .then((body) => setDocuments(body.documents.filter((d) => DOC_TYPES.some((t) => t.value === d.document_type))))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load documents."))
      .finally(() => setLoadingDocs(false));
  }

  function selectProfile(profile: Profile) {
    setSelected(profile);
    setError("");
    setMessage("");
    loadDocuments(profile.id);
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", docType);
      formData.append("exhibitorProfileId", String(selected.id));
      await api.post("/documents", formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage(`${DOC_TYPES.find((t) => t.value === docType)?.label} uploaded for ${selected.display_name}.`);
      loadDocuments(selected.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const profileColumns: DataTableColumn<Profile>[] = [
    { key: "display_name", label: "Company" },
    { key: "legal_name", label: "Legal Name" },
    { key: "company_email", label: "Email", render: (p) => p.company_email || "—" },
    { key: "profile_status", label: "Status" }
  ];

  if (!selected) {
    return (
      <>
        <div className="content-header">
          <h1 className="content-title">Exhibitor Documents</h1>
          <p className="content-subtitle">Select an exhibitor to upload a Performa Invoice, Invoice, Letter of Participation, or Certificate of Incorporation on their behalf.</p>
        </div>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

        <DataTable
          columns={profileColumns}
          rows={profiles}
          keyField={(p) => p.id}
          loading={loadingProfiles}
          searchPlaceholder="Search exhibitors…"
          emptyMessage="No exhibitors found."
          actions={(p) => (
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => selectProfile(p)}>
              Select
            </button>
          )}
        />
      </>
    );
  }

  return (
    <>
      <div className="content-header d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 className="content-title">{selected.display_name}</h1>
          <p className="content-subtitle">Upload exhibitor documents</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
          <i className="bx bx-chevron-left" /> Change Exhibitor
        </button>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Upload a Document</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleUpload}>
            <div className="grid grid-3" style={{ alignItems: "end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Document Type</label>
                <select className="form-control form-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">File (PDF)</label>
                <input type="file" className="form-control" ref={fileInputRef} accept=".pdf" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <button type="submit" className="btn btn-primary w-100" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Documents on File</span>
        </div>
        {loadingDocs ? (
          <div className="card-body" style={{ textAlign: "center" }}>
            <div className="spinner" />
          </div>
        ) : documents.length === 0 ? (
          <div className="card-body">
            <p className="text-muted text-small mb-0">None of the 4 document types have been uploaded for this exhibitor yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {documents.map((d) => (
              <div key={d.id} className="d-flex justify-between align-center" style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--ez-divider)" }}>
                <div>
                  <div className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                    {DOC_TYPES.find((t) => t.value === d.document_type)?.label || d.document_type}
                  </div>
                  <a href={api.fileUrl(`/documents/${d.id}/file`)} target="_blank" rel="noreferrer" className="text-xs">
                    {d.original_filename}
                  </a>
                </div>
                <span className="text-xs text-muted">Uploaded {formatDate(d.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminDocumentsPage() {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <AdminDocumentsPageInner />
    </Suspense>
  );
}
