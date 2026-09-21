"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../_lib/apiClient";

interface ExportDef {
  key: string;
  label: string;
  description: string;
}

// Fully data-driven: the list of exportable datasets comes from the backend
// registry (routes/exhibitorZone/admin/exports.js) — adding a new export type
// there makes it appear here automatically, no frontend change needed.
export default function AdminExportsPage() {
  const [exportDefs, setExportDefs] = useState<ExportDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ExportDef | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const rangeInvalid = Boolean(from && to && from > to);

  function openDialog(def: ExportDef) {
    setFrom("");
    setTo("");
    setSelected(def);
  }

  function download() {
    if (!selected || rangeInvalid) return;
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const query = qs.toString();
    window.open(api.fileUrl(`/admin/exports/${selected.key}${query ? `?${query}` : ""}`), "_blank", "noopener");
    setSelected(null);
  }

  useEffect(() => {
    api
      .get<{ exports: ExportDef[] }>("/admin/exports")
      .then((body) => setExportDefs(body.exports))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load export options."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Export Data</h1>
        <p className="content-subtitle">Download any dataset for this event as a CSV file, ready to open in Excel</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {exportDefs.map((e) => (
            <div key={e.key} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
              <div className="d-flex align-center gap-2 mb-2">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--ez-bg-body)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <i className="bx bx-file" style={{ fontSize: "1.25rem", color: "var(--ez-primary)" }} />
                </div>
                <span className="fw-600" style={{ color: "var(--ez-dark)" }}>
                  {e.label}
                </span>
              </div>
              <p className="text-small text-muted mb-3" style={{ flex: 1 }}>
                {e.description}
              </p>
              <button type="button" className="btn btn-primary btn-sm w-100" onClick={() => openDialog(e)}>
                <i className="bx bx-download" /> Download CSV
              </button>
            </div>
          ))}

          {exportDefs.length === 0 && !error && <p className="text-muted text-small">No export types are available.</p>}
        </div>
      )}

      {selected && (
        <div className="ez-modal-overlay" onClick={() => setSelected(null)}>
          <div className="ez-modal" style={{ maxWidth: 440 }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ez-modal-header">
              <span className="ez-modal-title">Export {selected.label}</span>
            </div>
            <div className="ez-modal-body">
              <p className="text-small text-muted mb-3">Choose a date range for the data to export, or leave both blank to export everything.</p>
              <div className="d-flex gap-2" style={{ flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label className="form-label" htmlFor="export-from">
                    From date
                  </label>
                  <input id="export-from" type="date" className="form-control" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label className="form-label" htmlFor="export-to">
                    To date
                  </label>
                  <input id="export-to" type="date" className="form-control" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              {rangeInvalid && <div className="alert alert-danger mt-3 mb-0">The From date must not be after the To date.</div>}
            </div>
            <div className="ez-modal-footer">
              <button type="button" className="btn btn-sm" onClick={() => setSelected(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={download} disabled={rangeInvalid}>
                <i className="bx bx-download" /> Download
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
