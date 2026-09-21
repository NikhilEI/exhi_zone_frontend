"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDateTime } from "../../../_lib/format";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Coupon {
  id: number;
  coupon_code: string;
  exhibitor_profile_id: number;
  exhibitor_name: string;
  holder_name: string;
  holder_email: string | null;
  holder_phone: string | null;
  holder_company: string | null;
  holder_designation: string | null;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Coupon | null>(null);

  useEffect(() => {
    api
      .get<{ coupons: Coupon[]; limit: number }>("/coupons")
      .then((body) => {
        setCoupons(body.coupons);
        setLimit(body.limit);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load coupon codes."))
      .finally(() => setLoading(false));
  }, []);

  const exhibitorCount = new Set(coupons.map((c) => c.exhibitor_profile_id)).size;

  const columns: DataTableColumn<Coupon>[] = [
    { key: "exhibitor_name", label: "Exhibitor", render: (c) => <span className="fw-600">{c.exhibitor_name}</span> },
    { key: "coupon_code", label: "Coupon Code", render: (c) => <span style={{ fontFamily: "monospace" }}>{c.coupon_code}</span> },
    { key: "holder_name", label: "Guest" },
    { key: "holder_email", label: "Email", value: (c) => c.holder_email || "" },
    { key: "holder_phone", label: "Mobile", value: (c) => c.holder_phone || "" },
    {
      key: "holder_company",
      label: "Company / Designation",
      value: (c) => [c.holder_designation, c.holder_company].filter(Boolean).join(", ")
    },
    { key: "created_at", label: "Generated", render: (c) => formatDateTime(c.created_at) }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Coupon Codes</h1>
        <p className="content-subtitle">
          {coupons.length} coupon{coupons.length === 1 ? "" : "s"} across {exhibitorCount} exhibitor{exhibitorCount === 1 ? "" : "s"} (max {limit} each)
        </p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={coupons}
        keyField={(c) => c.id}
        loading={loading}
        searchPlaceholder="Search exhibitor, code or guest…"
        emptyMessage="No coupon codes have been generated yet."
        actions={(c) => (
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setPreview(c)}>
            <i className="bx bx-qr" /> View QR
          </button>
        )}
      />

      {preview && (
        <div className="ez-modal-overlay" onClick={() => setPreview(null)}>
          <div className="ez-modal" style={{ maxWidth: 360 }} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="ez-modal-header">
              <span className="ez-modal-title">{preview.exhibitor_name}</span>
            </div>
            <div className="ez-modal-body" style={{ textAlign: "center" }}>
              <img src={api.fileUrl(`/coupons/${preview.id}/qrcode.png`)} alt={`QR code for ${preview.coupon_code}`} style={{ width: 220, height: 220 }} />
              <div className="fw-600" style={{ fontFamily: "monospace", marginTop: "0.5rem" }}>
                {preview.coupon_code}
              </div>
              <div style={{ marginTop: "0.5rem" }}>{preview.holder_name}</div>
            </div>
            <div className="ez-modal-footer">
              <button type="button" className="btn btn-sm" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
