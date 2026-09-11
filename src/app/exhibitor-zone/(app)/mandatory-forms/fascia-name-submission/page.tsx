"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";
import { useMandatoryFormGate } from "../../../_lib/useMandatoryFormGate";
import { useAdminProfileParam, withProfileId } from "../../../_lib/adminProfile";
import AdminEditingBanner from "../../../_components/AdminEditingBanner";
import { formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";

const FASCIA_MAX_LENGTH = 28;
const FASCIA_STANDARD_URL = "https://www.convergenceindia.org/exhibitor-zone/general-info-exhi-manual-fascia.aspx#fascia";

interface Submission {
  id: number;
  template_slug: string;
  status: string;
  version: number;
  reviewer_notes: string | null;
  created_at: string;
  data: { fasciaName?: string };
}

export default function FasciaNameSubmissionPage() {
  const router = useRouter();
  const gateOk = useMandatoryFormGate();
  const { profileId, company } = useAdminProfileParam();
  const [eligible, setEligible] = useState<boolean | null>(profileId ? true : null);
  const [existing, setExisting] = useState<Submission | null>(null);
  const [fasciaName, setFasciaName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    // Admin editing on behalf of an exhibitor bypasses the Shell-Space-only
    // eligibility check (already reflected in the initial useState above) —
    // see booth-design-submission for the same reasoning.
    if (!profileId) {
      api
        .get<{ info: { booth_type: string } | null }>("/mandatory-forms/exhibitor-information")
        .then((body) => setEligible(body.info?.booth_type === "Shell Space"))
        .catch(() => setEligible(false));
    }

    api
      .get<{ submissions: Submission[] }>(withProfileId("/forms/submissions", profileId))
      .then((body) => {
        const found = body.submissions.find((s) => s.template_slug === "fascia-name-submission") || null;
        setExisting(found);
        if (found) setFasciaName(found.data.fasciaName || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profileId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setSavedMessage("");
    setError("");

    if (!fasciaName.trim()) {
      setError("Fascia Name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(withProfileId("/forms/submissions/fascia-name-submission", profileId), { fasciaName: fasciaName.trim() });
      const body = await api.get<{ submissions: Submission[] }>(withProfileId("/forms/submissions", profileId));
      const saved = body.submissions.find((s) => s.template_slug === "fascia-name-submission") || null;
      setExisting(saved);
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
          <p className="text-muted text-small mb-4">This form is only applicable for Shell Scheme booths. Raw Space exhibitors can skip the Fascia Name.</p>
          <button type="button" className="btn btn-primary w-100" onClick={() => router.push("/exhibitor-zone/mandatory-forms")}>
            Back to Mandatory Forms
          </button>
        </div>
      </div>
    );
  }

  const charsLeft = FASCIA_MAX_LENGTH - fasciaName.length;

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Fascia Name Submission</h1>
        <p className="content-subtitle">Please note: Last date of submission is 7th March 2027, post which no forms will be entertained.</p>
      </div>

      {profileId && <AdminEditingBanner profileId={profileId} company={company} />}

      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">Important: The fascia name will be printed exactly as submitted. Please verify spelling and capitalization carefully.</span>
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
          <span className="card-title">Fascia Name Details</span>
        </div>
        <div className="card-body">
          <p className="text-small text-muted mb-1">Only applicable for Shell Scheme booth.</p>
          <p className="text-small text-muted mb-3">Raw booth Exhibitor to skip the Fascia name.</p>
          <p className="text-small mb-3">
            <a href={FASCIA_STANDARD_URL} target="_blank" rel="noopener noreferrer">
              Click here to view the perspective, side and elevation of the Standard <i className="bx bx-link-external" />
            </a>
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Fascia Name <span style={{ color: "var(--ez-danger)" }}>*</span>
              </label>
              <input
                className={`form-control ${error ? "is-invalid" : ""}`}
                value={fasciaName}
                maxLength={FASCIA_MAX_LENGTH}
                onChange={(e) => {
                  setFasciaName(e.target.value.slice(0, FASCIA_MAX_LENGTH));
                  setError("");
                }}
              />
              {error && <div className="invalid-feedback d-block">{error}</div>}
              <div className="d-flex justify-between mt-1">
                <span className="text-xs text-muted">Fascia Name as to be printed on the booth (Max {FASCIA_MAX_LENGTH} Characters)</span>
                <span className="text-xs text-muted">No. of characters left: {charsLeft}</span>
              </div>
            </div>

            <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
              <span className="text-xs text-muted">Note: * fields are mandatory</span>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
