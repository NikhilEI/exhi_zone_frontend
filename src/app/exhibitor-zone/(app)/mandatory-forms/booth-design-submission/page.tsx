"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";
import { useMandatoryFormGate } from "../../../_lib/useMandatoryFormGate";
import { useAdminProfileParam, withProfileId } from "../../../_lib/adminProfile";
import AdminEditingBanner from "../../../_components/AdminEditingBanner";
import SupportContactBanner from "../../../_components/SupportContactBanner";
import { formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";

const CONTRACTOR_OPTIONS = [
  "Pavilions & Interiors (India) Pvt. Ltd.",
  "Artemim Exhibitions & Interio",
  "BDeck",
  "Brand Serve Events Pvt. Ltd.",
  "BM Innovations (India) Pvt. Ltd.",
  "Interior Today Exhibition Pvt. Ltd.",
  "Membrane Decors",
  "Panache Exhibitions Pvt. Ltd.",
  "P D Exhibits",
  "Reidius Exhibits Pvt. Ltd.",
  "Sconce Global Pvt Ltd",
  "Skyline Events",
  "Surbhi Exhibitions",
  "Spectra Creative Solutions Pvt. Ltd.",
  "The Expohouse Worldwide",
  "White Shark Entertainment Pvt. Ltd.",
  "MOD Interiors Pvt. Ltd.",
  "Moxie Exhibitions Pvt Ltd.",
  "WeDo Creative Solutions",
  "YM Events Pvt. Ltd.",
  "Future Art Display",
  "Radiate Designs",
  "Opensquare Private Limited",
  "Mauve Design Solution",
  "Indo Exhibits",
  "Wood Experts (Evencias Buzz)",
  "Designing Labs",
  "J. M. Designs"
];

const EMPANELLED_CONTRACTORS_URL = "https://www.convergenceindia.org/empanelled-contractors.aspx";
const DECLARATION_TEXT =
  "I confirm that the submitted booth design complies with the exhibition's technical guidelines, venue regulations and applicable terms & conditions. I understand that the design is subject to approval by the Organiser and that any changes communicated during the review process will be incorporated before execution.";

interface Submission {
  id: number;
  template_slug: string;
  status: string;
  version: number;
  reviewer_notes: string | null;
  created_at: string;
  data: { standContractor?: string; attachDesign?: "Yes" | "No"; designDocumentId?: number };
}

interface FormState {
  standContractor: string;
  attachDesign: "" | "Yes" | "No";
}

const initialForm: FormState = { standContractor: "", attachDesign: "Yes" };

export default function BoothDesignSubmissionPage() {
  const router = useRouter();
  const gateOk = useMandatoryFormGate();
  const { profileId, company } = useAdminProfileParam();
  const [eligible, setEligible] = useState<boolean | null>(profileId ? true : null);
  const [existing, setExisting] = useState<Submission | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const [showDeclaration, setShowDeclaration] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);

  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designDocumentId, setDesignDocumentId] = useState<number | null>(null);
  const [designExistingLabel, setDesignExistingLabel] = useState("");
  const [designUploading, setDesignUploading] = useState(false);
  const [designError, setDesignError] = useState("");

  useEffect(() => {
    // Admin editing on behalf of an exhibitor bypasses the Raw-Space-only
    // eligibility check (already reflected in the initial useState above) —
    // they may be filling this in before booth_type is even set, or fixing
    // a misclassification.
    if (!profileId) {
      api
        .get<{ info: { booth_type: string } | null }>("/mandatory-forms/exhibitor-information")
        .then((body) => setEligible(body.info?.booth_type === "Raw Space"))
        .catch(() => setEligible(false));
    }

    api
      .get<{ submissions: Submission[] }>(withProfileId("/forms/submissions", profileId))
      .then((body) => {
        const found = body.submissions.find((s) => s.template_slug === "booth-design-submission") || null;
        setExisting(found);
        if (found) {
          setForm({
            standContractor: found.data.standContractor || "",
            attachDesign: found.data.attachDesign || "Yes"
          });
          if (found.data.designDocumentId) {
            setDesignDocumentId(found.data.designDocumentId);
            setDesignExistingLabel("Previously uploaded design");
          }
        }
      })
      .catch(() => {})
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

  async function handleDesignSelect(file: File | null) {
    setDesignError("");
    if (!file) return;

    setDesignFile(file);
    setDesignUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", "booth_design");
      if (profileId) formData.append("exhibitorProfileId", String(profileId));
      const body = await api.post<{ documentId: number }>("/documents", formData);
      setDesignDocumentId(body.documentId);
      setDesignExistingLabel("");
    } catch (err) {
      setDesignError(err instanceof ApiError ? err.message : "Failed to upload design.");
      setDesignFile(null);
    } finally {
      setDesignUploading(false);
    }
  }

  function handleAttachDesignChange(value: "Yes" | "No") {
    setField("attachDesign", value);
    setErrors((prev) => {
      if (!prev.design) return prev;
      const next = { ...prev };
      delete next.design;
      return next;
    });
    if (value === "No" && (designFile || designDocumentId)) {
      handleDesignRemove();
    }
  }

  async function handleDesignRemove() {
    if (designDocumentId && designFile) {
      api.delete(`/documents/${designDocumentId}`, { silent: true }).catch(() => {});
    }
    setDesignFile(null);
    setDesignDocumentId(null);
    setDesignExistingLabel("");
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (!form.standContractor) next.standContractor = "Please select your stand contractor.";
    if (form.attachDesign === "Yes" && !designDocumentId) next.design = "Please attach your booth design.";
    return next;
  }

  function handleContinue() {
    setApiError("");
    setSavedMessage("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setDeclarationChecked(false);
    setShowDeclaration(true);
  }

  async function handleAgreeAndSubmit() {
    setApiError("");
    setSubmitting(true);
    try {
      await api.post(withProfileId("/forms/submissions/booth-design-submission", profileId), {
        standContractor: form.standContractor,
        attachDesign: form.attachDesign,
        designDocumentId: form.attachDesign === "Yes" ? designDocumentId : undefined,
        declarationAccepted: true
      });

      const body = await api.get<{ submissions: Submission[] }>(withProfileId("/forms/submissions", profileId));
      const saved = body.submissions.find((s) => s.template_slug === "booth-design-submission") || null;
      setExisting(saved);
      setShowDeclaration(false);
      setSavedMessage(saved ? `Saved — Version v${saved.version} submitted on ${formatDate(saved.created_at)}.` : "Saved.");
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || eligible === null || !gateOk) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="card text-center" style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
        <div className="card-body" style={{ padding: "2.5rem 1.5rem" }}>
          <i className="bx bx-info-circle" style={{ fontSize: "3rem", color: "var(--ez-muted)" }} />
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Not required</h3>
          <p className="text-muted text-small mb-4">This form is only required for Raw Space exhibitors.</p>
          <button type="button" className="btn btn-primary w-100" onClick={() => router.push("/exhibitor-zone/mandatory-forms")}>
            Back to Mandatory Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Booth Design Submission</h1>
        <p className="content-subtitle">It is mandatory for all raw space exhibitors to submit the booth design for approval by 7th March 2027.</p>
      </div>

      <SupportContactBanner />

      {profileId && <AdminEditingBanner profileId={profileId} company={company} />}

      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">Important: Please ensure all booth artwork and design files follow the exhibition guidelines before submission.</span>
      </div>

      {existing && (
        <div className="card mb-3" style={{ padding: "1rem 1.25rem" }}>
          <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <span className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                Current submission
              </span>
              <div className="text-xs text-muted mt-1">
                Version v{existing.version} · Submitted {formatDate(existing.created_at)}
              </div>
            </div>
            <StatusBadge status={existing.status} />
          </div>
          {existing.reviewer_notes && (
            <p className="text-small text-muted mt-2 mb-0">
              <strong>Reviewer comment:</strong> {existing.reviewer_notes}
            </p>
          )}
          <p className="text-xs text-muted mt-2 mb-0">Editing and resubmitting below will send it back for re-review.</p>
        </div>
      )}

      {savedMessage && <div className="alert alert-success mb-3">{savedMessage}</div>}
      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Booth Design Details</span>
        </div>
        <div className="card-body">
          <p className="text-small text-muted mb-3">
            All Raw Space Exhibitors are advised to take services of our approved empanelled stand contractors for your booth design and construction.{" "}
            <a href={EMPANELLED_CONTRACTORS_URL} target="_blank" rel="noopener noreferrer">
              Click here to view the details of the Empanelled Contractors <i className="bx bx-link-external" />
            </a>
          </p>

          <div className="form-group">
            <label className="form-label">
              Your Stand Contractor <span style={{ color: "var(--ez-danger)" }}>*</span>
            </label>
            <select
              className={`form-control form-select ${errors.standContractor ? "is-invalid" : ""}`}
              value={form.standContractor}
              onChange={(e) => setField("standContractor", e.target.value)}
            >
              <option value="">Select Contractor</option>
              {CONTRACTOR_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.standContractor && <div className="invalid-feedback d-block">{errors.standContractor}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Attach your design <span style={{ color: "var(--ez-danger)" }}>*</span>
            </label>
            <div className="d-flex gap-3" style={{ marginTop: "0.5rem" }}>
              <label className="d-flex align-center gap-1" style={{ cursor: "pointer" }}>
                <input type="radio" name="attachDesign" checked={form.attachDesign === "Yes"} onChange={() => handleAttachDesignChange("Yes")} />
                Yes
              </label>
              <label className="d-flex align-center gap-1" style={{ cursor: "pointer" }}>
                <input type="radio" name="attachDesign" checked={form.attachDesign === "No"} onChange={() => handleAttachDesignChange("No")} />
                No
              </label>
            </div>
            <p className="text-xs text-muted mt-1">
              {form.attachDesign === "No" ? "You can skip attaching a design file for now." : "Attaching your booth design is mandatory."}
            </p>
          </div>

          {form.attachDesign === "Yes" && (
            <div className="form-group">
              <label className="form-label">
                Design File <span style={{ color: "var(--ez-danger)" }}>*</span>
              </label>
              {!designFile && !designExistingLabel && (
                <input
                  type="file"
                  className={`form-control ${errors.design ? "is-invalid" : ""}`}
                  onChange={(e) => handleDesignSelect(e.target.files?.[0] || null)}
                />
              )}
              {(designFile || designExistingLabel) && (
                <div className="d-flex align-center gap-2" style={{ padding: "0.625rem 0.875rem", border: "1px solid var(--ez-border)", borderRadius: "var(--ez-border-radius)" }}>
                  {designUploading ? (
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : (
                    <i className="bx bx-check-circle" style={{ color: "var(--ez-success)" }} />
                  )}
                  <span className="text-small" style={{ flex: 1 }}>
                    {designFile ? designFile.name : designExistingLabel}
                  </span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleDesignRemove} disabled={designUploading}>
                    Remove
                  </button>
                </div>
              )}
              {designError && <div className="invalid-feedback d-block">{designError}</div>}
              {errors.design && <div className="invalid-feedback d-block">{errors.design}</div>}
            </div>
          )}

          <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
            <span className="text-xs text-muted">Note: * marked fields are mandatory</span>
            <button type="button" className="btn btn-primary" disabled={submitting || designUploading} onClick={handleContinue}>
              Continue
            </button>
          </div>
        </div>
      </div>

      {showDeclaration && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
        >
          <div className="card" style={{ maxWidth: 560, width: "100%" }}>
            <div className="card-header">
              <span className="card-title">Declaration / Terms &amp; Conditions</span>
            </div>
            <div className="card-body">
              {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}
              <label className="d-flex gap-2" style={{ cursor: "pointer", alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={declarationChecked}
                  onChange={(e) => setDeclarationChecked(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: "0.15rem", flexShrink: 0 }}
                />
                <span className="text-small">{DECLARATION_TEXT}</span>
              </label>

              <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-ghost" disabled={submitting} onClick={() => setShowDeclaration(false)}>
                  Back
                </button>
                <button type="button" className="btn btn-primary" disabled={!declarationChecked || submitting} onClick={handleAgreeAndSubmit}>
                  {submitting ? "Submitting..." : "I Agree & Submit Design"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
