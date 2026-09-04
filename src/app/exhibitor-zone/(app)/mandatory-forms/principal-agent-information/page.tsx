"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";
import { countries } from "@/data/countries";

const ADD_MORE_VALUE = "__add_more__";

interface Sector {
  id: number;
  name: string;
  sort_order: number;
}

interface Record_ {
  id: number;
  type: "Principal" | "Agent";
  company_name: string;
  website: string | null;
  country_name: string;
  country_code: string;
  sector_id: number | null;
  custom_sector: string | null;
  sector_name: string | null;
}

interface FormState {
  type: string;
  companyName: string;
  website: string;
  countryCode: string;
  sectorSelection: string;
  customSector: string;
}

const initialForm: FormState = {
  type: "",
  companyName: "",
  website: "",
  countryCode: "",
  sectorSelection: "",
  customSector: ""
};

export default function PrincipalAgentInformationPage() {
  const router = useRouter();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [records, setRecords] = useState<Record_[]>([]);
  const [noPrincipalAgent, setNoPrincipalAgent] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [declarationSaving, setDeclarationSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Record_ | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ sectors: Sector[] }>("/mandatory-forms/principal-agent-sectors"),
      api.get<{ records: Record_[]; noPrincipalAgent: boolean }>("/mandatory-forms/principal-agent-information")
    ])
      .then(([sectorBody, infoBody]) => {
        setSectors(sectorBody.sectors);
        setRecords(infoBody.records);
        setNoPrincipalAgent(infoBody.noPrincipalAgent);
      })
      .catch((err) => setApiError(err instanceof ApiError ? err.message : "Failed to load Principal/Agent information."))
      .finally(() => setLoading(false));
  }, []);

  const isCompleted = records.length > 0 || noPrincipalAgent;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const isAddMore = form.sectorSelection === ADD_MORE_VALUE;

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.type) next.type = "Please select Principal or Agent.";
    if (!form.companyName.trim()) next.companyName = "Company Name is required.";
    if (!form.countryCode) next.countryCode = "Please select a country.";
    if (!form.sectorSelection) next.sectorSelection = "Please select a sector.";
    if (isAddMore && !form.customSector.trim()) next.customSector = "Please specify the sector.";
    if (form.website.trim() && !/^https?:\/\/.+/i.test(form.website.trim())) {
      next.website = "Please enter a valid URL (starting with http:// or https://).";
    }
    return next;
  }

  async function handleAddRecord(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const country = countries.find((c) => c.code === form.countryCode);
    if (!country) {
      setErrors({ countryCode: "Please select a country." });
      return;
    }

    setSubmitting(true);
    try {
      const body = await api.post<{ message: string }>("/mandatory-forms/principal-agent-information/records", {
        type: form.type,
        companyName: form.companyName.trim(),
        website: form.website.trim() || undefined,
        countryName: country.name,
        countryCode: country.code,
        sectorId: isAddMore ? undefined : Number(form.sectorSelection),
        customSector: isAddMore ? form.customSector.trim() : undefined
      });
      void body;
      const refreshed = await api.get<{ records: Record_[]; noPrincipalAgent: boolean }>("/mandatory-forms/principal-agent-information");
      setRecords(refreshed.records);
      setNoPrincipalAgent(refreshed.noPrincipalAgent);
      setForm(initialForm);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setApiError("");
    try {
      await api.delete(`/mandatory-forms/principal-agent-information/records/${deleteTarget.id}`);
      const refreshed = await api.get<{ records: Record_[]; noPrincipalAgent: boolean }>("/mandatory-forms/principal-agent-information");
      setRecords(refreshed.records);
      setNoPrincipalAgent(refreshed.noPrincipalAgent);
      setDeleteTarget(null);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to delete record.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleNoPrincipalAgentToggle(checked: boolean) {
    if (checked && records.length > 0) return;
    setApiError("");
    setDeclarationSaving(true);
    try {
      await api.patch("/mandatory-forms/principal-agent-information/declaration", { noPrincipalAgent: checked });
      setNoPrincipalAgent(checked);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to save.");
    } finally {
      setDeclarationSaving(false);
    }
  }

  const entryNumber = records.length + 1;

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
        <h1 className="content-title">Principal / Agent Information</h1>
        <p className="content-subtitle">Please note: Last date of submission is 7th March 2027, post which no forms will be entertained.</p>
      </div>

      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">Important: Ensure all details are accurate before submission.</span>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Principal / Agent Details</span>
        </div>
        <div className="card-body">
          <p className="text-small text-muted mb-0">
            If you are an authorized distributor/reseller of any brand(s) then you may list their information under Principal.
            <br />
            If your products &amp; services are being sold through channel partners then you may list their information under Agent.
          </p>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Existing Entries</span>
        </div>
        <div className="card-body">
          {records.length === 0 ? (
            <p className="text-muted text-small mb-0">No Principal/Agent records added yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Principal / Agent</th>
                    <th>Company Name</th>
                    <th>Website</th>
                    <th>Country</th>
                    <th>Sector</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.type}</td>
                      <td>{r.company_name}</td>
                      <td>{r.website || "—"}</td>
                      <td>{r.country_name}</td>
                      <td>{r.sector_name || r.custom_sector || "—"}</td>
                      <td>
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--ez-danger)" }} onClick={() => setDeleteTarget(r)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-group" style={{ marginTop: "1.25rem", marginBottom: 0 }}>
            <label className="d-flex align-center gap-2" style={{ cursor: records.length > 0 ? "not-allowed" : "pointer" }}>
              <input
                type="checkbox"
                checked={noPrincipalAgent}
                disabled={records.length > 0 || declarationSaving}
                onChange={(e) => handleNoPrincipalAgentToggle(e.target.checked)}
              />
              <span className="text-small">I do not have any Principal / Agent information to provide.</span>
            </label>
          </div>
        </div>
      </div>

      {!noPrincipalAgent && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Add Principal / Agent</span>
          </div>
          <div className="card-body">
            <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
              Principal / Agent {entryNumber}
            </p>

            <form noValidate onSubmit={handleAddRecord}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Principal / Agent <span style={{ color: "var(--ez-danger)" }}>*</span>
                  </label>
                  <select className={`form-control form-select ${errors.type ? "is-invalid" : ""}`} value={form.type} onChange={(e) => setField("type", e.target.value)}>
                    <option value="">Please Select</option>
                    <option value="Principal">Principal</option>
                    <option value="Agent">Agent</option>
                  </select>
                  {errors.type && <div className="invalid-feedback d-block">{errors.type}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Company Name <span style={{ color: "var(--ez-danger)" }}>*</span>
                  </label>
                  <input className={`form-control ${errors.companyName ? "is-invalid" : ""}`} value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} />
                  {errors.companyName && <div className="invalid-feedback d-block">{errors.companyName}</div>}
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className={`form-control ${errors.website ? "is-invalid" : ""}`} value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://example.com" />
                  {errors.website && <div className="invalid-feedback d-block">{errors.website}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Country <span style={{ color: "var(--ez-danger)" }}>*</span>
                  </label>
                  <select className={`form-control form-select ${errors.countryCode ? "is-invalid" : ""}`} value={form.countryCode} onChange={(e) => setField("countryCode", e.target.value)}>
                    <option value="">Choose a Country</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.countryCode && <div className="invalid-feedback d-block">{errors.countryCode}</div>}
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Sector <span style={{ color: "var(--ez-danger)" }}>*</span>
                  </label>
                  <select
                    className={`form-control form-select ${errors.sectorSelection ? "is-invalid" : ""}`}
                    value={form.sectorSelection}
                    onChange={(e) => setField("sectorSelection", e.target.value)}
                  >
                    <option value="">-- Select Sector--</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value={ADD_MORE_VALUE}>Add More</option>
                  </select>
                  {errors.sectorSelection && <div className="invalid-feedback d-block">{errors.sectorSelection}</div>}
                </div>
                {isAddMore && (
                  <div className="form-group">
                    <label className="form-label">
                      Please specify sector <span style={{ color: "var(--ez-danger)" }}>*</span>
                    </label>
                    <input className={`form-control ${errors.customSector ? "is-invalid" : ""}`} value={form.customSector} onChange={(e) => setField("customSector", e.target.value)} />
                    {errors.customSector && <div className="invalid-feedback d-block">{errors.customSector}</div>}
                  </div>
                )}
              </div>

              <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
                <span className="text-xs text-muted">Note: * fields are mandatory</span>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "+ Add More"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="d-flex justify-end" style={{ marginTop: "1.5rem" }}>
        <button type="button" className="btn btn-primary" disabled={!isCompleted} onClick={() => router.push("/exhibitor-zone/mandatory-forms")}>
          {isCompleted ? "Done — Back to Mandatory Forms" : "Add at least one record to continue"}
        </button>
      </div>

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div className="card" style={{ maxWidth: 420, width: "90%" }}>
            <div className="card-header">
              <span className="card-title">Delete this record?</span>
            </div>
            <div className="card-body">
              <p className="text-small mb-4">
                Are you sure you want to delete the {deleteTarget.type.toLowerCase()} record for <strong>{deleteTarget.company_name}</strong>? This cannot be undone.
              </p>
              <div className="d-flex justify-end gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary btn-sm" style={{ background: "var(--ez-danger)", borderColor: "var(--ez-danger)" }} onClick={confirmDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
