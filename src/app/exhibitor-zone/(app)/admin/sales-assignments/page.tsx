"use client";

import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { api, ApiError } from "../../../_lib/apiClient";
import { showErrorAlert, showSuccessAlert } from "../../../_lib/alerts";

interface Assignment {
  profileId: number;
  company: string;
  salesman: string;
  changed: boolean;
}

interface PreviewResponse {
  totalRows: number;
  willAssign: number;
  willChange: number;
  problems: { row: number; message: string }[];
  assignments: Assignment[];
}

export default function SalesAssignmentsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange() {
    setFile(fileInputRef.current?.files?.[0] || null);
    setPreview(null);
    setApplied(false);
    setError("");
  }

  async function handlePreview() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      setPreview(await api.post<PreviewResponse>("/admin/sales-assignments/preview", formData, { silent: true }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to read this file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!file || !preview) return;
    const confirmed = await Swal.fire({
      icon: "question",
      title: "Apply these assignments?",
      html: `<b>${preview.willAssign}</b> exhibitor(s) will be assigned (<b>${preview.willChange}</b> new or changed). Each salesman will only see their own exhibitors.`,
      showCancelButton: true,
      confirmButtonText: "Yes, assign",
      cancelButtonText: "Cancel"
    });
    if (!confirmed.isConfirmed) return;

    setApplying(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.post<{ message: string }>("/admin/sales-assignments/apply", formData, { silent: true });
      setApplied(true);
      showSuccessAlert(result.message);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Assignment failed.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setApplying(false);
    }
  }

  const blocked = Boolean(preview && preview.problems.length > 0);

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Sales Assignments</h1>
        <p className="content-subtitle">Assign exhibitors to salesmen from an Excel sheet — each salesman only sees their own clients</p>
      </div>

      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">
          The first sheet needs a <b>Salesman Email</b> column (must be an active Sales account) and one of <b>Exhibitor ID</b>,{" "}
          <b>Profile Code</b> or <b>Company Name</b> per row. Re-uploading reassigns the listed exhibitors; exhibitors not in the sheet
          keep their current salesman. Exhibitors with no salesman are visible to admins only.
        </span>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="form-group mb-0">
            <label className="form-label">Excel or CSV file</label>
            <div className="d-flex gap-2" style={{ flexWrap: "wrap" }}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="form-control" style={{ maxWidth: 420 }} onChange={handleFileChange} />
              <button type="button" className="btn btn-primary" disabled={!file || loading} onClick={handlePreview}>
                {loading ? "Reading file…" : "Preview"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && (
        <>
          {applied && <div className="alert alert-success mb-3">Assignments applied.</div>}

          <div className="card mb-3">
            <div className="card-body">
              <div className="d-flex gap-3" style={{ flexWrap: "wrap" }}>
                <div>
                  <div className="text-small text-muted">Rows in file</div>
                  <div className="fw-700">{preview.totalRows}</div>
                </div>
                <div>
                  <div className="text-small text-muted">Will be assigned</div>
                  <div className="fw-700">{preview.willAssign}</div>
                </div>
                <div>
                  <div className="text-small text-muted">New or changed</div>
                  <div className="fw-700">{preview.willChange}</div>
                </div>
                <div>
                  <div className="text-small text-muted">Problems</div>
                  <div className="fw-700" style={{ color: preview.problems.length ? "var(--ez-danger)" : undefined }}>
                    {preview.problems.length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {blocked && (
            <div className="alert alert-danger mb-3">
              <strong>Fix these rows and re-upload — nothing is applied while any row has a problem:</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {preview.problems.map((p, i) => (
                  <li key={i}>
                    Row {p.row}: {p.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.assignments.length > 0 && (
            <div className="card mb-3">
              <div className="card-header">
                <span className="card-title">Assignments</span>
              </div>
              <div className="card-body" style={{ maxHeight: 360, overflowY: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Exhibitor</th>
                      <th>Salesman</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.assignments.map((a) => (
                      <tr key={a.profileId}>
                        <td>{a.company}</td>
                        <td>{a.salesman}</td>
                        <td>{a.changed ? "New / changed" : "No change"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!applied && (
            <button type="button" className="btn btn-primary" disabled={blocked || applying || preview.willAssign === 0} onClick={handleApply}>
              {applying ? "Applying…" : "Apply assignments"}
            </button>
          )}
        </>
      )}
    </>
  );
}
