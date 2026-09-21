"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../_lib/apiClient";
import { formatDate } from "../../_lib/format";

interface Coupon {
  id: number;
  coupon_code: string;
  exhibitor_name: string;
  holder_name: string;
  holder_email: string | null;
  holder_phone: string | null;
  holder_company: string | null;
  holder_designation: string | null;
  created_at: string;
}

interface CouponsResponse {
  coupons: Coupon[];
  limit: number;
  used: number;
}

const EMPTY_FORM = { holderName: "", holderEmail: "", holderPhone: "", holderCompany: "", holderDesignation: "" };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

// Opens the coupon on its own in a clean window and prints it — avoids
// printing the whole app chrome around one card.
function printCoupon(coupon: Coupon) {
  const win = window.open("", "_blank", "width=420,height=560");
  if (!win) return;
  win.document.write(`<!doctype html><html><head><title>${escapeHtml(coupon.coupon_code)}</title>
    <style>
      body { font-family: Arial, sans-serif; display: flex; justify-content: center; margin: 24px; }
      .card { width: 300px; border: 2px solid #222; border-radius: 12px; padding: 20px; text-align: center; }
      .exh { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
      .name { font-size: 15px; margin: 12px 0 2px; }
      .sub { font-size: 12px; color: #555; }
      .code { font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 1px; margin-top: 12px; }
      img { width: 220px; height: 220px; margin-top: 8px; }
    </style></head><body>
    <div class="card">
      <div class="exh">${escapeHtml(coupon.exhibitor_name)}</div>
      <div class="sub">Coupon Code</div>
      <img id="qr" src="${api.fileUrl(`/coupons/${coupon.id}/qrcode.png`)}" alt="QR code" />
      <div class="code">${escapeHtml(coupon.coupon_code)}</div>
      <div class="name">${escapeHtml(coupon.holder_name)}</div>
      <div class="sub">${escapeHtml([coupon.holder_designation, coupon.holder_company].filter(Boolean).join(", "))}</div>
    </div>
    <script>
      var img = document.getElementById("qr");
      function go() { window.print(); }
      if (img.complete) go(); else img.onload = go;
    </script></body></html>`);
  win.document.close();
}

export default function CouponsPage() {
  const [data, setData] = useState<CouponsResponse | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    api
      .get<CouponsResponse>("/coupons")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load coupon codes."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const used = data?.used ?? 0;
  const limit = data?.limit ?? 50;
  const limitReached = used >= limit;

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/coupons", {
        holderName: form.holderName,
        holderEmail: form.holderEmail || undefined,
        holderPhone: form.holderPhone || undefined,
        holderCompany: form.holderCompany || undefined,
        holderDesignation: form.holderDesignation || undefined
      });
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate coupon.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Coupon Codes</h1>
        <p className="content-subtitle">Enter a guest&apos;s details to generate a QR coupon code with your company name and a unique ID</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-header d-flex justify-between align-center">
          <span className="card-title">Generate a Coupon</span>
          <span className="text-small text-muted">
            {used} of {limit} used
          </span>
        </div>
        <div className="card-body">
          {limitReached ? (
            <p className="text-muted text-small mb-0">You have generated the maximum of {limit} coupon codes.</p>
          ) : (
            <form onSubmit={handleGenerate}>
              <div className="grid grid-3" style={{ alignItems: "end" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Guest Name *</label>
                  <input className="form-control" value={form.holderName} onChange={(e) => setField("holderName", e.target.value)} maxLength={150} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.holderEmail} onChange={(e) => setField("holderEmail", e.target.value)} maxLength={254} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Mobile</label>
                  <input className="form-control" value={form.holderPhone} onChange={(e) => setField("holderPhone", e.target.value)} maxLength={30} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Company</label>
                  <input className="form-control" value={form.holderCompany} onChange={(e) => setField("holderCompany", e.target.value)} maxLength={200} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Designation</label>
                  <input className="form-control" value={form.holderDesignation} onChange={(e) => setField("holderDesignation", e.target.value)} maxLength={150} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={saving}>
                {saving ? "Generating..." : "Generate Coupon"}
              </button>
            </form>
          )}
        </div>
      </div>

      {data && data.coupons.length === 0 ? (
        <div className="card text-center" style={{ maxWidth: 600, margin: "3rem auto", padding: "3.5rem 2rem" }}>
          <div style={{ fontSize: "3.5rem", color: "var(--ez-muted)", marginBottom: "1.25rem" }}>
            <i className="bx bx-purchase-tag" />
          </div>
          <h3 style={{ color: "var(--ez-dark)", marginBottom: "0.75rem" }}>No Coupons Yet</h3>
          <p className="text-muted text-small mb-0" style={{ lineHeight: 1.5 }}>
            Fill in a guest&apos;s details above to generate your first QR coupon code.
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {data?.coupons.map((coupon) => (
            <div key={coupon.id} className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem", textAlign: "center" }}>
                <div className="fw-700" style={{ color: "var(--ez-dark)" }}>
                  {coupon.exhibitor_name}
                </div>
                <div style={{ background: "#fff", display: "inline-block", padding: 6, borderRadius: 6, margin: "0.75rem 0 0.5rem", border: "1px solid var(--ez-divider)" }}>
                  <img src={api.fileUrl(`/coupons/${coupon.id}/qrcode.png`)} alt={`QR code for ${coupon.coupon_code}`} style={{ width: 150, height: 150, display: "block" }} />
                </div>
                <div className="fw-600" style={{ fontFamily: "monospace", letterSpacing: "1px" }}>
                  {coupon.coupon_code}
                </div>
                <div style={{ marginTop: "0.75rem" }}>{coupon.holder_name}</div>
                <div className="text-small text-muted">{[coupon.holder_designation, coupon.holder_company].filter(Boolean).join(", ")}</div>
                <div className="text-xs text-muted" style={{ marginTop: "0.25rem" }}>
                  Generated {formatDate(coupon.created_at)}
                </div>
              </div>
              <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--ez-divider)", background: "var(--ez-bg-body)" }}>
                <button type="button" onClick={() => printCoupon(coupon)} className="btn btn-primary btn-sm w-100">
                  <i className="bx bx-printer" /> Print
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
