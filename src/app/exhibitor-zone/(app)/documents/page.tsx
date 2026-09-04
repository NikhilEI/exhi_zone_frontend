"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { api, ApiError } from "../../_lib/apiClient";
import { formatDate } from "../../_lib/format";
import DataTable, { type DataTableColumn } from "../../_components/DataTable";

interface Document {
  id: number;
  document_type: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  is_verified: number;
  created_at: string;
}

const DOC_TYPES = ["gst_certificate", "pan_card", "company_logo", "insurance_policy", "fire_noc", "other"];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    api
      .get<{ documents: Document[] }>("/documents")
      .then((body) => setDocuments(body.documents))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load documents."))
      .finally(() => setLoading(false));
  }

  // load() is reused for both mount and post-action refetches, so its
  // setLoading(true) call is intentional even though it's redundant on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", docType);
      await api.post("/documents", formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this document?")) return;
    try {
      await api.delete(`/documents/${id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete document.");
    }
  }

  const columns: DataTableColumn<Document>[] = [
    { key: "document_type", label: "Type", render: (doc) => <span style={{ textTransform: "capitalize" }}>{doc.document_type.replace(/_/g, " ")}</span> },
    {
      key: "original_filename",
      label: "File",
      render: (doc) => (
        <a href={api.fileUrl(`/documents/${doc.id}/file`)} target="_blank" rel="noreferrer">
          {doc.original_filename}
        </a>
      )
    },
    { key: "file_size_bytes", label: "Size", value: (doc) => doc.file_size_bytes, render: (doc) => `${(doc.file_size_bytes / 1024).toFixed(1)} KB` },
    {
      key: "is_verified",
      label: "Verified",
      render: (doc) => (doc.is_verified ? <span className="badge badge-success">Verified</span> : <span className="badge badge-secondary">Pending</span>)
    },
    { key: "created_at", label: "Uploaded", render: (doc) => formatDate(doc.created_at) }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Documents</h1>
        <p className="content-subtitle">Upload and manage compliance certificates, licenses, and company files</p>
      </div>

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Upload a Document</span>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger mb-3">{error}</div>}
          <form onSubmit={handleUpload}>
            <div className="grid grid-3" style={{ alignItems: "end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Document Type</label>
                <select className="form-control form-select" value={docType} onChange={(e) => setDocType(e.target.value)}>
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t} style={{ textTransform: "capitalize" }}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">File</label>
                <input type="file" className="form-control" ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" required />
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

      <DataTable
        columns={columns}
        rows={documents}
        keyField={(doc) => doc.id}
        loading={loading}
        searchPlaceholder="Search documents…"
        emptyMessage="No documents uploaded yet."
        actions={(doc) => (
          <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--ez-danger)" }} onClick={() => handleDelete(doc.id)}>
            <i className="bx bx-trash" />
          </button>
        )}
      />
    </>
  );
}
