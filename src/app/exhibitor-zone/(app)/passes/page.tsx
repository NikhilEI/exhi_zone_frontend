"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "../../_lib/apiClient";
import StatusBadge from "../../_components/StatusBadge";

interface PassAllocation {
  id: number;
  pass_type_name: string;
  allocated_qty: number;
  issued_qty: number;
}

interface Pass {
  id: number;
  holder_first_name: string;
  holder_last_name: string;
  pass_type_name: string;
  status: string;
  qr_code: string;
}

function handlePrint(passId: number) {
  const printContent = document.getElementById(`pass-card-${passId}`);
  if (!printContent) return;
  const originalContent = document.body.innerHTML;
  document.body.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#fff;">${printContent.outerHTML}</div>`;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload();
}

export default function PassesPage() {
  const [allocations, setAllocations] = useState<PassAllocation[]>([]);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<number | "">("");
  const [holderFirstName, setHolderFirstName] = useState("");
  const [holderLastName, setHolderLastName] = useState("");
  const [holderEmail, setHolderEmail] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    Promise.all([api.get<{ allocations: PassAllocation[] }>("/passes/allocations"), api.get<{ passes: Pass[] }>("/passes")])
      .then(([a, p]) => {
        setAllocations(a.allocations);
        setPasses(p.passes);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load passes."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleIssue(e: FormEvent) {
    e.preventDefault();
    if (!selectedAllocation) return;
    setIssuing(true);
    setError("");
    try {
      await api.post("/passes/issue", {
        allocationId: selectedAllocation,
        holderFirstName,
        holderLastName,
        holderEmail: holderEmail || undefined
      });
      setHolderFirstName("");
      setHolderLastName("");
      setHolderEmail("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to issue pass.");
    } finally {
      setIssuing(false);
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
        <h1 className="content-title">Exhibitor Access Passes</h1>
        <p className="content-subtitle">Issue, verify, and print entry badges for your in-house team members</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Issue a Pass</span>
        </div>
        <div className="card-body">
          {allocations.length === 0 ? (
            <p className="text-muted text-small mb-0">No pass quota has been allocated to your company yet. Contact the organiser.</p>
          ) : (
            <form onSubmit={handleIssue}>
              <div className="grid grid-4" style={{ alignItems: "end" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Pass Type</label>
                  <select className="form-control form-select" value={selectedAllocation} onChange={(e) => setSelectedAllocation(Number(e.target.value))} required>
                    <option value="">Select…</option>
                    {allocations.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.issued_qty >= a.allocated_qty}>
                        {a.pass_type_name} ({a.issued_qty}/{a.allocated_qty} used)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">First Name</label>
                  <input className="form-control" value={holderFirstName} onChange={(e) => setHolderFirstName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input className="form-control" value={holderLastName} onChange={(e) => setHolderLastName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={holderEmail} onChange={(e) => setHolderEmail(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={issuing}>
                {issuing ? "Issuing..." : "Issue Pass"}
              </button>
            </form>
          )}
        </div>
      </div>

      {passes.length === 0 ? (
        <div className="card text-center" style={{ maxWidth: 600, margin: "3rem auto", padding: "3.5rem 2rem" }}>
          <div style={{ fontSize: "3.5rem", color: "var(--ez-muted)", marginBottom: "1.25rem" }}>
            <i className="bx bx-id-card" />
          </div>
          <h3 style={{ color: "var(--ez-dark)", marginBottom: "0.75rem" }}>No Passes Issued</h3>
          <p className="text-muted text-small mb-0" style={{ lineHeight: 1.5 }}>
            Issue a pass above once your company has a badge quota allocated by the organiser.
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {passes.map((pass) => (
            <div key={pass.id} className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div
                id={`pass-card-${pass.id}`}
                style={{
                  width: "280px",
                  height: "400px",
                  background: "linear-gradient(135deg, #2c3e50, #1a252f)",
                  color: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "1.5rem",
                  margin: "1.5rem auto",
                  fontFamily: "inherit"
                }}
              >
                <div style={{ width: "100%", borderBottom: "2px solid rgba(255,255,255,0.15)", paddingBottom: "0.75rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "2px", color: "#696cff", fontWeight: 700 }}>Wellness India</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, marginTop: "0.2rem" }}>Expo 2027</div>
                </div>

                <div
                  style={{
                    background: "#e74c3c",
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.3rem 1.1rem",
                    borderRadius: 30,
                    marginTop: "1rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase"
                  }}
                >
                  {pass.pass_type_name}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", margin: "1rem 0" }}>
                  <div style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                    {pass.holder_first_name} {pass.holder_last_name}
                  </div>
                  <div style={{ marginTop: "0.6rem" }}>
                    <StatusBadge status={pass.status} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderTop: "2px solid rgba(255,255,255,0.15)", paddingTop: "0.75rem", width: "100%" }}>
                  <div style={{ width: 76, height: 76, background: "#fff", padding: 4, borderRadius: 4 }}>
                    <img src={api.fileUrl(`/passes/${pass.id}/qrcode.png`)} alt="Pass QR code" style={{ width: 68, height: 68 }} />
                  </div>
                  <div style={{ fontSize: "0.55rem", color: "#95a5a6", marginTop: "0.35rem", letterSpacing: "1px" }}>ID: {pass.qr_code.slice(0, 10).toUpperCase()}</div>
                </div>
              </div>

              <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid var(--ez-divider)", display: "flex", gap: "0.5rem", background: "var(--ez-bg-body)" }}>
                <button onClick={() => handlePrint(pass.id)} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  <i className="bx bx-printer" /> Print Badge
                </button>
                <Link href={`/exhibitor-zone/passes/${pass.id}`} className="btn btn-outline-primary btn-sm" style={{ flex: 1, textAlign: "center" }}>
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
