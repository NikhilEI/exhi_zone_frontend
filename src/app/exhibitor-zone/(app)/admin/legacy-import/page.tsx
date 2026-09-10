"use client";

import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { api, ApiError } from "../../../_lib/apiClient";
import { showErrorAlert, showSuccessAlert } from "../../../_lib/alerts";

interface ImportReport {
  companies: { create: string[]; skipNoName: number };
  users: { create: number; noEmailSkipped: number };
  stalls: { allocate: string[]; collisions: string[] };
  directoryInfo: { create: number; truncatedProfile: string[] };
  principalAgent: { create: number; unmatched: string[] };
  productIndex: { create: number; unmatchedSubcategory: string[] };
  productIndexOther: { create: number; unmatchedCompany: number };
  badges: { create: number; unmatched: string[] };
  fascia: { create: number; unmatched: string[]; skippedNoUser: number };
  orders: { create: number; itemsCreate: number; unmatchedCompany: string[]; skippedNoUser: number };
  warnings: string[];
}

interface PreviewResponse {
  event: { id: number; name: string };
  report: ImportReport;
  alreadyImported: string[];
}

function StatTile({ label, value, tone }: { label: string; value: number | string; tone?: "danger" | "muted" }) {
  const color = tone === "danger" ? "var(--ez-danger)" : tone === "muted" ? "var(--ez-muted)" : "var(--ez-primary)";
  return (
    <div className="card" style={{ padding: "1rem 1.25rem" }}>
      <div className="text-small text-muted mb-1">{label}</div>
      <div className="fw-700" style={{ fontSize: "1.4rem", color }}>
        {value}
      </div>
    </div>
  );
}

function ListDetail({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-2">
      <div className="text-xs fw-600 text-muted">{title}</div>
      <ul className="text-xs text-muted" style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem" }}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LegacyImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState("");

  function handleFileChange() {
    const f = fileInputRef.current?.files?.[0] || null;
    setFile(f);
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
      const result = await api.post<PreviewResponse>("/admin/legacy-import/preview", formData, { silent: true });
      setPreview(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to preview this file.");
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    if (!file || !preview) return;

    const confirmed = await Swal.fire({
      icon: "warning",
      title: "Apply this import?",
      html: `This will create <b>${preview.report.companies.create.length}</b> companies, <b>${preview.report.users.create}</b> login accounts, and everything else shown below, for real, in this database. This cannot be undone from here — make sure a DB backup exists first if this is production.`,
      showCancelButton: true,
      confirmButtonText: "Yes, apply it",
      confirmButtonColor: "var(--ez-danger)",
      cancelButtonText: "Cancel"
    });
    if (!confirmed.isConfirmed) return;

    setApplying(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.post<PreviewResponse>("/admin/legacy-import/apply", formData, { silent: true });
      setPreview(result);
      setApplied(true);
      showSuccessAlert(`Legacy data imported into ${result.event.name}.`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Import failed.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setApplying(false);
    }
  }

  const r = preview?.report;

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Legacy Import</h1>
        <p className="content-subtitle">Upload the legacy Exhibitor Zone Excel export to migrate it into this system</p>
      </div>

      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">
          Upload the workbook (Company Profile, Principal Agent, Product Index, Badges, Fascia-Name, cart Catlogue sheets), preview what
          will be created, then apply. This never writes the uploaded file to disk on this server — it&apos;s parsed in memory only.
        </span>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="form-group mb-0">
            <label className="form-label">Excel file (.xlsx)</label>
            <div className="d-flex gap-2" style={{ flexWrap: "wrap" }}>
              <input ref={fileInputRef} type="file" accept=".xlsx" className="form-control" style={{ maxWidth: 420 }} onChange={handleFileChange} />
              <button type="button" className="btn btn-primary" disabled={!file || loading} onClick={handlePreview}>
                {loading ? "Reading file…" : "Preview"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {preview && r && (
        <>
          {preview.alreadyImported.length > 0 && (
            <div className="alert alert-danger mb-3">
              <strong>Already imported:</strong> {preview.alreadyImported.join(", ")} already exist as users in this database. Applying
              this file again would create duplicate companies — it will be refused.
            </div>
          )}
          {applied && <div className="alert alert-success mb-3">Import applied to {preview.event.name}.</div>}

          <div className="grid mb-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <StatTile label="Companies" value={r.companies.create.length} />
            <StatTile label="Login accounts" value={r.users.create} />
            <StatTile label="No login (no email)" value={r.users.noEmailSkipped} tone="muted" />
            <StatTile label="Stall allocations" value={r.stalls.allocate.length} />
            <StatTile label="Booth collisions" value={r.stalls.collisions.length} tone={r.stalls.collisions.length ? "danger" : undefined} />
            <StatTile label="Principal/Agent" value={r.principalAgent.create} />
            <StatTile label="Product selections" value={r.productIndex.create + r.productIndexOther.create} />
            <StatTile label="Badges" value={r.badges.create} />
            <StatTile label="Fascia submissions" value={r.fascia.create} />
            <StatTile label="Orders" value={r.orders.create} />
            <StatTile label="Order line items" value={r.orders.itemsCreate} />
            <StatTile label="Warnings" value={r.warnings.length} tone={r.warnings.length ? "danger" : undefined} />
          </div>

          <div className="card mb-3">
            <div className="card-header">
              <span className="card-title">Details</span>
            </div>
            <div className="card-body">
              <ListDetail title={`Skipped — no company name (${r.companies.skipNoName})`} items={r.companies.skipNoName ? [`${r.companies.skipNoName} row(s) had a login but no company name`] : []} />
              <ListDetail title="Booth collisions (first claim kept, second skipped)" items={r.stalls.collisions} />
              <ListDetail title="Company Profile text truncated to 400 chars" items={r.directoryInfo.truncatedProfile} />
              <ListDetail title="Principal/Agent — unmatched company" items={r.principalAgent.unmatched} />
              <ListDetail title="Product Index — unmatched category text" items={r.productIndex.unmatchedSubcategory} />
              <ListDetail
                title={`Product Index_Other — unmatched company (${r.productIndexOther.unmatchedCompany})`}
                items={r.productIndexOther.unmatchedCompany ? [`${r.productIndexOther.unmatchedCompany} row(s) reference a company not in Company Profile`] : []}
              />
              <ListDetail title="Badges — unmatched company" items={r.badges.unmatched} />
              <ListDetail title="Fascia-Name — unmatched company" items={r.fascia.unmatched} />
              <ListDetail title="Orders — unmatched company" items={r.orders.unmatchedCompany} />
              <ListDetail title="Warnings" items={r.warnings} />
              {!r.stalls.collisions.length &&
                !r.directoryInfo.truncatedProfile.length &&
                !r.principalAgent.unmatched.length &&
                !r.productIndex.unmatchedSubcategory.length &&
                !r.productIndexOther.unmatchedCompany &&
                !r.badges.unmatched.length &&
                !r.fascia.unmatched.length &&
                !r.orders.unmatchedCompany.length &&
                !r.warnings.length && <p className="text-small text-muted mb-0">No issues to review.</p>}
            </div>
          </div>

          {!applied && (
            <button
              type="button"
              className="btn btn-danger"
              disabled={applying || preview.alreadyImported.length > 0}
              onClick={handleApply}
            >
              {applying ? "Applying…" : "Apply this import"}
            </button>
          )}
        </>
      )}
    </>
  );
}
