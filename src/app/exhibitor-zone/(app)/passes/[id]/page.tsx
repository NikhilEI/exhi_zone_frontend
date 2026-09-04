"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDateTime } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";

interface PassDetail {
  id: number;
  qr_code: string;
  holder_first_name: string;
  holder_last_name: string;
  holder_email: string | null;
  holder_phone: string | null;
  pass_type_name: string;
  status: string;
  issued_at: string;
}

export default function PassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pass, setPass] = useState<PassDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ pass: PassDetail }>(`/passes/${id}`)
      .then((body) => setPass(body.pass))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load pass."));
  }, [id]);

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Pass Detail</h1>
        <p className="content-subtitle">View badge holder details and QR entry code</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {pass && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="card" style={{ maxWidth: 420, width: "100%" }}>
            <div className="card-body" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
              <img src={api.fileUrl(`/passes/${pass.id}/qrcode.png`)} alt="QR code" style={{ width: 220, height: 220, margin: "0 auto" }} />
              <h3 style={{ marginTop: "1rem", marginBottom: "0.25rem", color: "var(--ez-dark)" }}>
                {pass.holder_first_name} {pass.holder_last_name}
              </h3>
              <p className="text-muted text-small mb-2">{pass.pass_type_name}</p>
              <StatusBadge status={pass.status} />

              <div style={{ borderTop: "1px solid var(--ez-divider)", marginTop: "1.5rem", paddingTop: "1.25rem", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                <div className="d-flex justify-between">
                  <span className="text-small text-muted">Email</span>
                  <span className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                    {pass.holder_email || "—"}
                  </span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-small text-muted">Phone</span>
                  <span className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                    {pass.holder_phone || "—"}
                  </span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-small text-muted">Issued</span>
                  <span className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                    {formatDateTime(pass.issued_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <Link href="/exhibitor-zone/passes" className="btn btn-ghost">
          <i className="bx bx-chevron-left" /> Back to Passes
        </Link>
      </div>
    </>
  );
}
