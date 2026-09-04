"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";

const PERSONNEL_OPTIONS = [
  { value: "Security Guard", inr: 2000, usd: 40 },
  { value: "Security Supervisor", inr: 3000, usd: 60 }
] as const;

interface SecurityRow {
  personnelType: string;
  personnel: string;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
}

const emptyRow: SecurityRow = { personnelType: PERSONNEL_OPTIONS[0].value, personnel: "1", fromDate: "", fromTime: "", toDate: "", toTime: "" };

function priceFor(personnelType: string) {
  return PERSONNEL_OPTIONS.find((o) => o.value === personnelType) || PERSONNEL_OPTIONS[0];
}

export default function SecurityPersonnelPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SecurityRow[]>([{ ...emptyRow }]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function updateRow(index: number, patch: Partial<SecurityRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const totals = useMemo(() => {
    const subtotalInr = rows.reduce((sum, row) => sum + priceFor(row.personnelType).inr * (Number(row.personnel) || 0), 0);
    const subtotalUsd = rows.reduce((sum, row) => sum + priceFor(row.personnelType).usd * (Number(row.personnel) || 0), 0);
    const gstInr = subtotalInr * 0.18;
    const gstUsd = subtotalUsd * 0.18;
    return { subtotalInr, subtotalUsd, gstInr, gstUsd, totalInr: subtotalInr + gstInr, totalUsd: subtotalUsd + gstUsd };
  }, [rows]);

  function validate(): Record<number, string> {
    const next: Record<number, string> = {};
    rows.forEach((row, i) => {
      if (!row.fromDate || !row.fromTime || !row.toDate || !row.toTime) {
        next[i] = "Please complete the from/to date and time.";
      } else if (!Number.isInteger(Number(row.personnel)) || Number(row.personnel) <= 0) {
        next[i] = "Number of personnel must be a positive whole number.";
      } else if (new Date(`${row.toDate}T${row.toTime}`) <= new Date(`${row.fromDate}T${row.fromTime}`)) {
        next[i] = "The 'to' date/time must be after the 'from' date/time.";
      }
    });
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/forms/submissions/security-personnel", {
        requests: rows.map((row) => ({
          personnelType: row.personnelType,
          personnel: Number(row.personnel),
          fromDate: row.fromDate,
          fromTime: row.fromTime,
          toDate: row.toDate,
          toTime: row.toTime
        }))
      });
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
          <p className="text-muted text-small mb-4">Our team will review your security personnel request and confirm availability and cost.</p>
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
        <h1 className="content-title">Security Personnel</h1>
        <p className="content-subtitle">
          General Security is provided round the clock by the organizers and normally additional security is not
          required. However, if exhibitors wish to hire additional security for their exhibits, they are advised to
          contact the Official Security Vendor only, for the services. Please provide the following security
          personnel requirements below:
        </p>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card">
        <div className="card-body">
          <form noValidate onSubmit={handleSubmit}>
            <div className="table-wrapper mb-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Security Personnel</th>
                    <th>12 hours shift*</th>
                    <th>No. of Personnel</th>
                    <th>From Date</th>
                    <th>From Time</th>
                    <th>To Date</th>
                    <th>To Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const price = priceFor(row.personnelType);
                    return (
                      <tr key={i}>
                        <td style={{ minWidth: 180 }}>
                          <select className="form-control form-select" value={row.personnelType} onChange={(e) => updateRow(i, { personnelType: e.target.value })}>
                            {PERSONNEL_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.value}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="text-small text-muted" style={{ whiteSpace: "nowrap" }}>
                          ₹{price.inr.toLocaleString("en-IN")} / ${price.usd}
                        </td>
                        <td style={{ minWidth: 100 }}>
                          <input type="number" min={1} className="form-control" value={row.personnel} onChange={(e) => updateRow(i, { personnel: e.target.value })} />
                        </td>
                        <td style={{ minWidth: 150 }}>
                          <input type="date" className="form-control" value={row.fromDate} onChange={(e) => updateRow(i, { fromDate: e.target.value })} />
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <input type="time" className="form-control" value={row.fromTime} onChange={(e) => updateRow(i, { fromTime: e.target.value })} />
                        </td>
                        <td style={{ minWidth: 150 }}>
                          <input type="date" className="form-control" value={row.toDate} onChange={(e) => updateRow(i, { toDate: e.target.value })} />
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <input type="time" className="form-control" value={row.toTime} onChange={(e) => updateRow(i, { toTime: e.target.value })} />
                        </td>
                        <td>
                          {rows.length > 1 && (
                            <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--ez-danger)" }} onClick={() => removeRow(i)}>
                              <i className="bx bx-trash" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted mb-3">* 12 hours shift</p>

            {Object.entries(errors).map(([i, msg]) => (
              <div key={i} className="text-xs" style={{ color: "var(--ez-danger)", marginBottom: "0.5rem" }}>
                Row {Number(i) + 1}: {msg}
              </div>
            ))}

            <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={addRow}>
              <i className="bx bx-plus" /> Add Another Row
            </button>

            <div className="grid grid-2" style={{ gap: "1.5rem", alignItems: "start" }}>
              <div style={{ background: "var(--ez-bg-body)", padding: "1.25rem", borderRadius: "var(--ez-border-radius-lg)", border: "1px solid var(--ez-border)" }}>
                <div className="d-flex justify-between mb-1">
                  <span className="text-small text-muted">Subtotal</span>
                  <span className="text-small">
                    ₹{totals.subtotalInr.toLocaleString("en-IN")} / ${totals.subtotalUsd.toLocaleString("en-US")}
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

              <div style={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
                <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
