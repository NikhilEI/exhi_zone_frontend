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
              <a href={api.fileUrl(`/admin/exports/${e.key}`)} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm w-100">
                <i className="bx bx-download" /> Download CSV
              </a>
            </div>
          ))}

          {exportDefs.length === 0 && !error && <p className="text-muted text-small">No export types are available.</p>}
        </div>
      )}
    </>
  );
}
