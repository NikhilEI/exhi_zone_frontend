"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";

const PRICE_PER_KW_INR = 5000;
const PRICE_PER_KW_USD = 125;

export default function AdditionalPowerSupplyPage() {
  const router = useRouter();
  const [kw, setKw] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const kwValue = Number(kw) || 0;
  const totals = useMemo(() => {
    const inr = kwValue * PRICE_PER_KW_INR;
    const usd = kwValue * PRICE_PER_KW_USD;
    const gstInr = inr * 0.18;
    const gstUsd = usd * 0.18;
    return { inr, usd, gstInr, gstUsd, totalInr: inr + gstInr, totalUsd: usd + gstUsd };
  }, [kwValue]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setApiError("");

    if (!kw || kwValue <= 0) {
      setError("Please enter the additional power load required (must be greater than 0).");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/forms/submissions/additional-power-supply", { kwRequired: kwValue });
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
          <p className="text-muted text-small mb-4">Our team will review your additional power requirement and confirm the final invoice.</p>
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
        <h1 className="content-title">Additional Power Supply</h1>
        <p className="content-subtitle">
          Raw Space Exhibitors have already been charged for standard power supply @ 1 KW of power for every 9 sqm
          along with the space invoice. Shell Space Exhibitors will be provided with a 5 Amp power outlet for every 9
          sqm. If you need additional power supply at your booth, kindly apply here.
        </p>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card">
        <div className="card-body">
          <form noValidate onSubmit={handleSubmit}>
            <div className="grid grid-2" style={{ gap: "2rem", alignItems: "start" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="kwRequired">
                  Additional Power Load Requirement — KW required <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input
                  id="kwRequired"
                  type="number"
                  min={0}
                  step="0.5"
                  className={`form-control ${error ? "is-invalid" : ""}`}
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                />
                {error && <div className="invalid-feedback d-block">{error}</div>}
                <p className="text-xs text-muted mt-1">
                  Pricing: ₹{PRICE_PER_KW_INR.toLocaleString("en-IN")} / ${PRICE_PER_KW_USD} per KW — Cost for all show days*
                </p>
                <a
                  href="https://www.convergenceindia.org/exhibitor-zone/additional-power-load.aspx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  Click here for more information <i className="bx bx-link-external" />
                </a>
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
