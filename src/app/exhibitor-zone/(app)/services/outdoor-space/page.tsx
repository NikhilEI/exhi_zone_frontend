"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";

const PRICE_PER_SQM_INR = 5500;
const PRICE_PER_SQM_USD = 110;

export default function OutdoorSpacePage() {
  const router = useRouter();
  const [sqm, setSqm] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const sqmValue = Number(sqm) || 0;
  const totals = useMemo(() => {
    const inr = sqmValue * PRICE_PER_SQM_INR;
    const usd = sqmValue * PRICE_PER_SQM_USD;
    const gstInr = inr * 0.18;
    const gstUsd = usd * 0.18;
    return { inr, usd, gstInr, gstUsd, totalInr: inr + gstInr, totalUsd: usd + gstUsd };
  }, [sqmValue]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setApiError("");

    if (!sqm || sqmValue <= 0) {
      setError("Please enter the outdoor space required (must be greater than 0).");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/forms/submissions/outdoor-space", { sqmsRequired: sqmValue });
      setDone(true);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card text-center" style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
        <div className="card-body" style={{ padding: "2.5rem 1.5rem" }}>
          <i className="bx bx-check-circle" style={{ fontSize: "3rem", color: "var(--ez-success)" }} />
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Request submitted</h3>
          <p className="text-muted text-small mb-4">Our team will review your outdoor space request and confirm availability and cost.</p>
          <button type="button" className="btn btn-primary w-100" onClick={() => router.push("/exhibitor-zone/forms/submissions")}>
            View My Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Outdoor Space</h1>
        <p className="content-subtitle">Request additional outdoor space adjoining your stand.</p>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card">
        <div className="card-body">
          <form noValidate onSubmit={handleSubmit}>
            <div className="grid grid-2" style={{ gap: "2rem", alignItems: "start" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="sqmsRequired">
                  Outdoor space required — Sqms <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input
                  id="sqmsRequired"
                  type="number"
                  min={0}
                  step="1"
                  className={`form-control ${error ? "is-invalid" : ""}`}
                  value={sqm}
                  onChange={(e) => setSqm(e.target.value)}
                />
                {error && <div className="invalid-feedback d-block">{error}</div>}
                <p className="text-xs text-muted mt-1">
                  Cost per sqm (US$ / Rs.): ${PRICE_PER_SQM_USD} / ₹{PRICE_PER_SQM_INR.toLocaleString("en-IN")}
                </p>
              </div>

              <div style={{ background: "var(--ez-bg-body)", padding: "1.25rem", borderRadius: "var(--ez-border-radius-lg)", border: "1px solid var(--ez-border)" }}>
                <div className="d-flex justify-between mb-1">
                  <span className="text-small text-muted">Subtotal</span>
                  <span className="text-small">
                    ₹{totals.inr.toLocaleString("en-IN")} / ${totals.usd.toLocaleString("en-US")}
                  </span>
                </div>
                <div className="d-flex justify-between mb-1">
                  <span className="text-small text-muted">GST (18%)</span>
                  <span className="text-small">
                    ₹{totals.gstInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} / ${totals.gstUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="d-flex justify-between" style={{ borderTop: "1px solid var(--ez-divider)", paddingTop: "0.5rem" }}>
                  <span className="fw-700" style={{ color: "var(--ez-dark)" }}>
                    Estimated Total
                  </span>
                  <span className="fw-700" style={{ color: "var(--ez-primary)" }}>
                    ₹{totals.totalInr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} / ${totals.totalUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <p className="text-xs text-muted mb-0" style={{ marginTop: "0.5rem" }}>
                  GST as applicable (Currently @ 18%)
                </p>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "1.5rem" }} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
