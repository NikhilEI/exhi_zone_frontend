"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";

const GUIDELINE_LINK = "https://www.convergenceindia.org/exhibitor-zone/guidelines-for-sound-noise-level.aspx";

const GUIDELINES = [
  "Dhol or drums, live bands, flash mobs, musical instruments, loudspeakers, etc. are strictly prohibited inside the exhibition hall.",
  "Music systems / Public Announcement Systems may be operated for product demonstrations for a limited duration, provided this does not disturb other participants.",
  "Volume level for any device or performance should not interfere or hamper normal conversation in the neighbouring booths.",
  "Any lucky draw or other promotional campaign must be held within the exhibit space, and should not disturb other participants.",
  "Any excessive noise emitted within the venue must not be of a noise level that prevents visitors or participants from hearing the emergency announcements.",
  "Sound of the speaker's and other electronic items playing inside the exhibitors' stand must not exceed 80 dB, measured at the closest aisle to the source of sound."
];

interface Acknowledgement {
  acknowledged: number;
  acknowledged_at: string | null;
  guideline_version: number;
}

export default function SoundNoiseGuidelinesPage() {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [checkboxError, setCheckboxError] = useState("");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api
      .get<{ acknowledgement: Acknowledgement | null }>("/mandatory-forms/sound-noise-guidelines")
      .then((body) => {
        if (body.acknowledgement?.acknowledged) {
          setAcknowledged(true);
          setCheckboxChecked(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setCheckboxError("");

    if (!checkboxChecked) {
      setCheckboxError("Please confirm that you have read & understood the above information.");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch("/mandatory-forms/sound-noise-guidelines", { acknowledged: true });
      setAcknowledged(true);
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
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Sound &amp; Noise Level Guidelines acknowledged</h3>
          <p className="text-muted text-small mb-4">This form is now marked as completed.</p>
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
        <h1 className="content-title">Sound &amp; Noise Level Guidelines</h1>
        <p className="content-subtitle">Please note: Last date of submission is 7th March 2027, post which no forms will be entertained.</p>
      </div>

      <div className="alert alert-warning mb-3">
        <i className="bx bx-volume-full" />
        <span className="text-small">Important: Exhibitors must ensure that all sound levels remain within the permitted exhibition guidelines.</span>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Guidelines &amp; Compliance Information</span>
        </div>
        <div className="card-body">
          <ol style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: 0 }}>
            {GUIDELINES.map((g, i) => (
              <li key={i} className="text-small" style={{ color: "var(--ez-dark)" }}>
                {g}
              </li>
            ))}
          </ol>

          <p className="text-small mt-3 mb-0">
            <a href={GUIDELINE_LINK} target="_blank" rel="noopener noreferrer">
              View full Sound &amp; Noise Level guidelines <i className="bx bx-link-external" />
            </a>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Declaration</span>
        </div>
        <div className="card-body">
          <p className="text-small mb-4">
            I / We have read the above guidelines and agree to abide by them, and any additional rules deemed necessary by the organiser. I / We understand that if the above
            guidelines are not adhered to, the organiser reserves the right to switch off the power supply, and close the exhibit space.
          </p>

          <form noValidate onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={checkboxChecked}
                  onChange={(e) => {
                    setCheckboxChecked(e.target.checked);
                    setCheckboxError("");
                  }}
                  disabled={acknowledged}
                />
                <span className="text-small fw-600">I confirm that I have read &amp; understood the above information.</span>
              </label>
              {checkboxError && <div className="invalid-feedback d-block">{checkboxError}</div>}
            </div>

            <div className="d-flex justify-between align-center" style={{ flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
              <span className="text-xs text-muted">Note: acknowledgement is mandatory</span>
              <button type="submit" className="btn btn-primary" disabled={submitting || !checkboxChecked}>
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
