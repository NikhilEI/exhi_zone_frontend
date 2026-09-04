"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";

interface TranslatorRow {
  role: string;
  fromLanguage: string;
  toLanguage: string;
  personnel: string;
  date: string;
}

const emptyRow: TranslatorRow = { role: "", fromLanguage: "", toLanguage: "", personnel: "1", date: "" };

export default function TranslatorsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<TranslatorRow[]>([{ ...emptyRow }]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function updateRow(index: number, patch: Partial<TranslatorRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, { ...emptyRow }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): Record<number, string> {
    const next: Record<number, string> = {};
    rows.forEach((row, i) => {
      if (!row.role.trim() || !row.fromLanguage.trim() || !row.toLanguage.trim() || !row.date) {
        next[i] = "Please complete all fields for this row.";
      } else if (!Number.isInteger(Number(row.personnel)) || Number(row.personnel) <= 0) {
        next[i] = "Number of personnel must be a positive whole number.";
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
      await api.post("/forms/submissions/translators", {
        requests: rows.map((row) => ({
          role: row.role.trim(),
          fromLanguage: row.fromLanguage.trim(),
          toLanguage: row.toLanguage.trim(),
          personnel: Number(row.personnel),
          date: row.date
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
          <p className="text-muted text-small mb-4">
            Exhibitions India Pvt. Ltd. will review your translator requirements and provide you with a quotation.
          </p>
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
        <h1 className="content-title">Translators</h1>
        <p className="content-subtitle">
          Translators and other specialised services may also be requested by using this form. Exhibitions India
          Pvt. Ltd. will provide you with the appropriate quotation.
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
                    <th>Role</th>
                    <th>From Language</th>
                    <th>To Language</th>
                    <th>No. of Personnel</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td style={{ minWidth: 160 }}>
                        <input className="form-control" value={row.role} onChange={(e) => updateRow(i, { role: e.target.value })} placeholder="e.g. Booth Guide" />
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <input className="form-control" value={row.fromLanguage} onChange={(e) => updateRow(i, { fromLanguage: e.target.value })} placeholder="English" />
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <input className="form-control" value={row.toLanguage} onChange={(e) => updateRow(i, { toLanguage: e.target.value })} placeholder="Hindi" />
                      </td>
                      <td style={{ minWidth: 110 }}>
                        <input type="number" min={1} className="form-control" value={row.personnel} onChange={(e) => updateRow(i, { personnel: e.target.value })} />
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <input type="date" className="form-control" value={row.date} onChange={(e) => updateRow(i, { date: e.target.value })} />
                      </td>
                      <td>
                        {rows.length > 1 && (
                          <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--ez-danger)" }} onClick={() => removeRow(i)}>
                            <i className="bx bx-trash" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {Object.entries(errors).map(([i, msg]) => (
              <div key={i} className="text-xs" style={{ color: "var(--ez-danger)", marginBottom: "0.5rem" }}>
                Row {Number(i) + 1}: {msg}
              </div>
            ))}

            <button type="button" className="btn btn-outline-primary btn-sm mb-3" onClick={addRow}>
              <i className="bx bx-plus" /> Add Another Row
            </button>

            <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem" }}>
              <span className="text-xs text-muted">GST as applicable (Currently @ 18%)</span>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
