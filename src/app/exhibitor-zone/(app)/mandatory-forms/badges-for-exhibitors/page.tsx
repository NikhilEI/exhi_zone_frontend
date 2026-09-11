"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";
import { useMandatoryFormGate } from "../../../_lib/useMandatoryFormGate";
import { useAdminProfileParam, withProfileId } from "../../../_lib/adminProfile";
import AdminEditingBanner from "../../../_components/AdminEditingBanner";
import { countries, findCountry } from "@/data/countries";

interface BadgeRecord {
  id: number;
  badge_id: string | null;
  full_name: string;
  designation: string;
  company_name: string;
  country: string;
  country_code: string;
  mobile_no: string;
  email: string;
}

interface FormState {
  fullName: string;
  designation: string;
  companyName: string;
  country: string;
  countryCode: string;
  mobileNo: string;
  email: string;
}

const initialForm: FormState = {
  fullName: "",
  designation: "",
  companyName: "",
  country: "",
  countryCode: "",
  mobileNo: "",
  email: ""
};

function downloadCsv(records: BadgeRecord[]) {
  const header = ["Badge ID", "Name", "Company Name", "Designation", "Email", "Phone No", "Country"];
  const rows = records.map((r) => [r.badge_id || "", r.full_name, r.company_name, r.designation, r.email, r.mobile_no, r.country]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exhibitor-badge-list.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function BadgesForExhibitorsPage() {
  const router = useRouter();
  const gateOk = useMandatoryFormGate();
  const { profileId, company } = useAdminProfileParam();
  const [records, setRecords] = useState<BadgeRecord[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BadgeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get<{ records: BadgeRecord[] }>(withProfileId("/mandatory-forms/badges-for-exhibitors", profileId))
      .then((body) => setRecords(body.records))
      .catch((err) => setApiError(err instanceof ApiError ? err.message : "Failed to load badge information."))
      .finally(() => setLoading(false));
  }, [profileId]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function handleCountryChange(name: string) {
    const country = findCountry(name);
    setForm((prev) => ({ ...prev, country: name, countryCode: country?.dialCode || "" }));
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = "Name is required.";
    if (!form.designation.trim()) next.designation = "Designation is required.";
    if (!form.companyName.trim()) next.companyName = "Company Name is required.";
    if (!form.country) next.country = "Please select a country.";
    if (!/^[0-9]{6,}$/.test(form.mobileNo.trim())) next.mobileNo = "Please enter a valid mobile number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Please enter a valid email address.";
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

    setSubmitting(true);
    try {
      await api.post(withProfileId("/mandatory-forms/badges-for-exhibitors/records", profileId), {
        fullName: form.fullName.trim(),
        designation: form.designation.trim(),
        companyName: form.companyName.trim(),
        country: form.country,
        countryCode: form.countryCode,
        mobileNo: form.mobileNo.trim(),
        email: form.email.trim()
      });
      const refreshed = await api.get<{ records: BadgeRecord[] }>(withProfileId("/mandatory-forms/badges-for-exhibitors", profileId));
      setRecords(refreshed.records);
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
      await api.delete(withProfileId(`/mandatory-forms/badges-for-exhibitors/records/${deleteTarget.id}`, profileId));
      const refreshed = await api.get<{ records: BadgeRecord[] }>(withProfileId("/mandatory-forms/badges-for-exhibitors", profileId));
      setRecords(refreshed.records);
      setDeleteTarget(null);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Failed to delete record.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !gateOk) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Badges for Exhibitors</h1>
        <p className="content-subtitle">Please note: Last date of submission is 7th March 2027, post which no forms will be entertained.</p>
      </div>

      {profileId && <AdminEditingBanner profileId={profileId} company={company} />}

      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">Important: Please ensure badge names are entered exactly as they should appear on the printed badge.</span>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Badge Information</span>
        </div>
        <div className="card-body">
          <p className="text-small text-muted mb-2">
            Please use this section to enter the names for Exhibitor Badges. You may add multiple names by clicking the Add / Remove button.
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: 0 }}
            disabled={records.length === 0}
            onClick={() => downloadCsv(records)}
          >
            <i className="bx bx-download" /> Click here to download the Exhibitor Badge List
          </button>

          {records.length > 0 && (
            <div className="table-wrapper mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Badge ID</th>
                    <th>Name</th>
                    <th>Company Name</th>
                    <th>Designation</th>
                    <th>Email</th>
                    <th>Phone No</th>
                    <th>Country</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <code className="text-xs">{r.badge_id || "—"}</code>
                      </td>
                      <td>{r.full_name}</td>
                      <td>{r.company_name}</td>
                      <td>{r.designation}</td>
                      <td>{r.email}</td>
                      <td>{r.mobile_no}</td>
                      <td>{r.country}</td>
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
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Add Badge</span>
        </div>
        <div className="card-body">
          <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
            Badge {records.length + 1}
          </p>

          <form noValidate onSubmit={handleAddRecord}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Name <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input className={`form-control ${errors.fullName ? "is-invalid" : ""}`} value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} />
                {errors.fullName && <div className="invalid-feedback d-block">{errors.fullName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Designation <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input className={`form-control ${errors.designation ? "is-invalid" : ""}`} value={form.designation} onChange={(e) => setField("designation", e.target.value)} />
                {errors.designation && <div className="invalid-feedback d-block">{errors.designation}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Company Name to be printed <span style={{ color: "var(--ez-danger)" }}>*</span>
              </label>
              <input className={`form-control ${errors.companyName ? "is-invalid" : ""}`} value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} />
              {errors.companyName && <div className="invalid-feedback d-block">{errors.companyName}</div>}
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Country <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <select className={`form-control form-select ${errors.country ? "is-invalid" : ""}`} value={form.country} onChange={(e) => handleCountryChange(e.target.value)}>
                  <option value="">Choose a Country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name} ({c.dialCode})
                    </option>
                  ))}
                </select>
                {errors.country && <div className="invalid-feedback d-block">{errors.country}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Country Code <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input className="form-control" value={form.countryCode} disabled placeholder="Auto-filled from country" />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Mobile No. <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input
                  type="tel"
                  className={`form-control ${errors.mobileNo ? "is-invalid" : ""}`}
                  maxLength={10}
                  value={form.mobileNo}
                  onChange={(e) => setField("mobileNo", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                />
                {errors.mobileNo && <div className="invalid-feedback d-block">{errors.mobileNo}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Email ID <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input type="email" className={`form-control ${errors.email ? "is-invalid" : ""}`} value={form.email} onChange={(e) => setField("email", e.target.value)} />
                {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
              </div>
            </div>

            <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
              <span className="text-xs text-muted">Note: * fields are mandatory</span>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Adding..." : "+ Add"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="d-flex justify-end" style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={records.length === 0}
          onClick={() =>
            router.push(profileId ? `/exhibitor-zone/admin/exhibitor-progress/${profileId}?company=${encodeURIComponent(company)}` : "/exhibitor-zone/mandatory-forms")
          }
        >
          {records.length > 0 ? `Done — Back to ${profileId ? "Exhibitor Progress" : "Mandatory Forms"}` : "Add at least one badge to continue"}
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
              <span className="card-title">Delete this badge?</span>
            </div>
            <div className="card-body">
              <p className="text-small mb-4">
                Are you sure you want to delete the badge for <strong>{deleteTarget.full_name}</strong>? This cannot be undone.
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
