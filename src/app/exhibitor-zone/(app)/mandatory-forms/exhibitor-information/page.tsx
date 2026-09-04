"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";
import { countries, findCountry } from "@/data/countries";

const HALL_OPTIONS = ["Hall 1", "Hall 2", "Hall 3", "Hall 4", "Hall 5"];
const BOOTH_TYPE_OPTIONS = ["Raw Space", "Shell Space"] as const;
const PROFILE_MAX_LENGTH = 400;

interface ExistingInfo {
  company_name: string;
  brand_name: string;
  hall_no: string | null;
  zone: string | null;
  booth_no: string | null;
  booth_type: string;
  country: string;
  country_code: string;
  phone_no: string | null;
  email: string;
  website: string | null;
  company_profile: string;
  company_logo_document_id: number | null;
}

interface FormState {
  companyName: string;
  brandName: string;
  hallNo: string;
  zone: string;
  boothNo: string;
  boothType: string;
  country: string;
  countryCode: string;
  phoneNo: string;
  email: string;
  website: string;
  companyProfile: string;
}

const initialForm: FormState = {
  companyName: "",
  brandName: "",
  hallNo: "",
  zone: "",
  boothNo: "",
  boothType: "",
  country: "",
  countryCode: "",
  phoneNo: "",
  email: "",
  website: "",
  companyProfile: ""
};

export default function ExhibitorInformationPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDocumentId, setLogoDocumentId] = useState<number | null>(null);
  const [logoExistingLabel, setLogoExistingLabel] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState("");

  useEffect(() => {
    api
      .get<{ info: ExistingInfo | null }>("/mandatory-forms/exhibitor-information")
      .then((body) => {
        if (body.info) {
          setForm({
            companyName: body.info.company_name || "",
            brandName: body.info.brand_name || "",
            hallNo: body.info.hall_no || "",
            zone: body.info.zone || "",
            boothNo: body.info.booth_no || "",
            boothType: body.info.booth_type || "",
            country: body.info.country || "",
            countryCode: body.info.country_code || "",
            phoneNo: body.info.phone_no || "",
            email: body.info.email || "",
            website: body.info.website || "",
            companyProfile: body.info.company_profile || ""
          });
          if (body.info.company_logo_document_id) {
            setLogoDocumentId(body.info.company_logo_document_id);
            setLogoExistingLabel("Previously uploaded logo");
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  async function handleLogoSelect(file: File | null) {
    setLogoError("");
    if (!file) return;

    const allowedExt = [".pdf", ".jpg", ".jpeg", ".ai"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExt.includes(ext)) {
      setLogoError("Please upload a PDF, JPEG, or AI file.");
      return;
    }

    setLogoFile(file);
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "company_logo");
      const body = await api.post<{ documentId: number }>("/documents", formData);
      setLogoDocumentId(body.documentId);
      setLogoExistingLabel("");
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : "Failed to upload logo.");
      setLogoFile(null);
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleLogoRemove() {
    if (logoDocumentId && logoFile) {
      // Only delete freshly-uploaded files in this session — leave a
      // previously-saved logo on the server until the user uploads a
      // replacement (removing it here would just be re-added on submit).
      api.delete(`/documents/${logoDocumentId}`).catch(() => {});
    }
    setLogoFile(null);
    setLogoDocumentId(null);
    setLogoExistingLabel("");
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.companyName.trim()) next.companyName = "Company Name is required.";
    if (!form.brandName.trim()) next.brandName = "Brand Name is required.";
    if (!BOOTH_TYPE_OPTIONS.includes(form.boothType as (typeof BOOTH_TYPE_OPTIONS)[number])) next.boothType = "Please select a booth type.";
    if (!form.country) next.country = "Please select a country.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Please enter a valid email address.";
    if (!form.companyProfile.trim()) next.companyProfile = "Company Profile is required.";
    else if (form.companyProfile.length > PROFILE_MAX_LENGTH) next.companyProfile = `Company Profile must be ${PROFILE_MAX_LENGTH} characters or fewer.`;
    if (!logoDocumentId) next.companyLogo = "Please upload your company logo.";
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
      await api.patch("/mandatory-forms/exhibitor-information", {
        companyName: form.companyName.trim(),
        brandName: form.brandName.trim(),
        hallNo: form.hallNo || undefined,
        zone: form.zone.trim() || undefined,
        boothNo: form.boothNo.trim() || undefined,
        boothType: form.boothType,
        country: form.country,
        countryCode: form.countryCode,
        phoneNo: form.phoneNo.trim() || undefined,
        email: form.email.trim(),
        website: form.website.trim() || undefined,
        companyProfile: form.companyProfile.trim(),
        companyLogoDocumentId: logoDocumentId
      });
      setDone(true);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="card text-center" style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
        <div className="card-body" style={{ padding: "2.5rem 1.5rem" }}>
          <i className="bx bx-check-circle" style={{ fontSize: "3rem", color: "var(--ez-success)" }} />
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Exhibitor Information saved</h3>
          <p className="text-muted text-small mb-4">This form is now marked as completed.</p>
          <button type="button" className="btn btn-primary w-100" onClick={() => router.push("/exhibitor-zone/mandatory-forms")}>
            Back to Mandatory Forms
          </button>
        </div>
      </div>
    );
  }

  const charsLeft = PROFILE_MAX_LENGTH - form.companyProfile.length;

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Exhibitor Information Form</h1>
        <p className="content-subtitle">Fill this form to proceed</p>
      </div>

      <div className="alert alert-warning mb-3">
        <i className="bx bx-time-five" />
        <span className="text-small">Please note: Last date of submission is 7th March 2026, post which no forms will be entertained.</span>
      </div>
      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">Important: The submitted information may be published in the official exhibition directory and website.</span>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Company Information to be printed in the Show Directory</span>
        </div>
        <div className="card-body">
          <form noValidate onSubmit={handleSubmit}>
            <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
              Company Information
            </p>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">
                  Company Name <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input className={`form-control ${errors.companyName ? "is-invalid" : ""}`} value={form.companyName} onChange={(e) => setField("companyName", e.target.value)} />
                {errors.companyName && <div className="invalid-feedback d-block">{errors.companyName}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">
                  Brand Name <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input className={`form-control ${errors.brandName ? "is-invalid" : ""}`} value={form.brandName} onChange={(e) => setField("brandName", e.target.value)} />
                {errors.brandName && <div className="invalid-feedback d-block">{errors.brandName}</div>}
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Hall No.</label>
                <select className="form-control form-select" value={form.hallNo} onChange={(e) => setField("hallNo", e.target.value)}>
                  <option value="">Select Hall</option>
                  {HALL_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Zone</label>
                <input
                  className="form-control"
                  value={form.zone}
                  onChange={(e) => setField("zone", e.target.value)}
                  placeholder="No zone list is configured yet — enter free text"
                />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Booth No.</label>
                <input className="form-control" value={form.boothNo} onChange={(e) => setField("boothNo", e.target.value)} placeholder="e.g. A-101" />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Booth Type <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <select className={`form-control form-select ${errors.boothType ? "is-invalid" : ""}`} value={form.boothType} onChange={(e) => setField("boothType", e.target.value)}>
                  <option value="">Select Booth</option>
                  {BOOTH_TYPE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {errors.boothType && <div className="invalid-feedback d-block">{errors.boothType}</div>}
              </div>
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
                <label className="form-label">Country Code</label>
                <input className="form-control" value={form.countryCode} disabled placeholder="Auto-filled from country" />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Phone No</label>
                <input
                  type="tel"
                  className="form-control"
                  maxLength={10}
                  value={form.phoneNo}
                  onChange={(e) => setField("phoneNo", e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Email <span style={{ color: "var(--ez-danger)" }}>*</span>
                </label>
                <input type="email" className={`form-control ${errors.email ? "is-invalid" : ""}`} value={form.email} onChange={(e) => setField("email", e.target.value)} />
                {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-control" value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://example.com" />
            </div>

            <div className="form-group">
              <label className="form-label">
                Company Profile <span style={{ color: "var(--ez-danger)" }}>*</span>
              </label>
              <textarea
                className={`form-control ${errors.companyProfile ? "is-invalid" : ""}`}
                rows={5}
                maxLength={PROFILE_MAX_LENGTH}
                value={form.companyProfile}
                onChange={(e) => setField("companyProfile", e.target.value.slice(0, PROFILE_MAX_LENGTH))}
              />
              <div className="d-flex justify-between mt-1">
                {errors.companyProfile ? (
                  <span className="text-xs" style={{ color: "var(--ez-danger)" }}>
                    {errors.companyProfile}
                  </span>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted">No. of characters left: {charsLeft}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Upload high res company logo (PDF/JPEG/Ai) <span style={{ color: "var(--ez-danger)" }}>*</span>
              </label>
              {!logoFile && !logoExistingLabel && (
                <input type="file" accept=".pdf,.jpg,.jpeg,.ai" className={`form-control ${errors.companyLogo ? "is-invalid" : ""}`} onChange={(e) => handleLogoSelect(e.target.files?.[0] || null)} />
              )}
              {(logoFile || logoExistingLabel) && (
                <div className="d-flex align-center gap-2" style={{ padding: "0.625rem 0.875rem", border: "1px solid var(--ez-border)", borderRadius: "var(--ez-border-radius)" }}>
                  {logoUploading ? (
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : (
                    <i className="bx bx-check-circle" style={{ color: "var(--ez-success)" }} />
                  )}
                  <span className="text-small" style={{ flex: 1 }}>
                    {logoFile ? logoFile.name : logoExistingLabel}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogoRemove} disabled={logoUploading}>
                    Remove
                  </button>
                </div>
              )}
              {logoError && <div className="invalid-feedback d-block">{logoError}</div>}
              {errors.companyLogo && <div className="invalid-feedback d-block">{errors.companyLogo}</div>}
              <p className="text-xs text-muted mt-1">Accepted formats: PDF, JPEG/JPG, AI.</p>
            </div>

            <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
              <span className="text-xs text-muted">Note: * fields are mandatory</span>
              <button type="submit" className="btn btn-primary" disabled={submitting || logoUploading}>
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
