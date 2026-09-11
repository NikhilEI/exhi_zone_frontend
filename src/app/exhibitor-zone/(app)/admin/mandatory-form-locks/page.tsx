"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

const FORM_LABELS: Record<string, string> = {
  "exhibitor-information": "Exhibitor Information",
  "product-information": "Product Information",
  "booth-design-submission": "Booth Design Submission",
  "fascia-name-submission": "Fascia Name Submission",
  "sound-noise-guidelines": "Sound & Noise Level Guidelines",
  "principal-agent-information": "Principal / Agent Information",
  "badges-for-exhibitors": "Badges for Exhibitors"
};
const FORM_KEYS = Object.keys(FORM_LABELS);

interface FieldDef {
  key: string;
  label: string;
  kind: "field" | "action";
}

interface ExhibitorProfile {
  id: number;
  display_name: string;
  legal_name: string;
  company_email: string | null;
  profile_status: string;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);
  return String(v);
}

export default function MandatoryFormLocksPage() {
  const [mode, setMode] = useState<"global" | "exhibitor">("global");
  const [formKey, setFormKey] = useState(FORM_KEYS[0]);
  const [fields, setFields] = useState<FieldDef[]>([]);

  const [globalLocked, setGlobalLocked] = useState<string[]>([]);

  const [profiles, setProfiles] = useState<ExhibitorProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ExhibitorProfile | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [exhibitorLocked, setExhibitorLocked] = useState<string[]>([]);
  const [globalLockedForExhibitor, setGlobalLockedForExhibitor] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function loadGlobal(key: string) {
    setLoading(true);
    setError("");
    api
      .get<{ lockedFieldKeys: string[] }>(`/admin/mandatory-form-locks/global?formKey=${key}`, { silent: true })
      .then((body) => setGlobalLocked(body.lockedFieldKeys))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load global locks."))
      .finally(() => setLoading(false));
  }

  function loadExhibitor(profileId: number, key: string) {
    setLoading(true);
    setError("");
    api
      .get<{
        companyName: string;
        fields: FieldDef[];
        values: Record<string, unknown>;
        locked: { global: string[]; exhibitor: string[] };
      }>(`/admin/mandatory-form-locks/${profileId}?formKey=${key}`, { silent: true })
      .then((body) => {
        setFields(body.fields);
        setValues(body.values);
        setExhibitorLocked(body.locked.exhibitor);
        setGlobalLockedForExhibitor(body.locked.global);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load exhibitor form data."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api
      .get<{ fields: FieldDef[] }>(`/admin/mandatory-form-locks/fields?formKey=${formKey}`, { silent: true })
      .then((body) => setFields(body.fields))
      .catch(() => {});
  }, [formKey]);

  useEffect(() => {
    // setMessage clears a success banner left over from a previous save
    // when the admin switches form/mode — the actual data fetch below is
    // what's async; this part just resets transient UI state synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage("");
    if (mode === "global") {
      loadGlobal(formKey);
    } else if (selectedProfile) {
      loadExhibitor(selectedProfile.id, formKey);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey, mode]);

  function switchToGlobal() {
    setMode("global");
    setMessage("");
    setError("");
    loadGlobal(formKey);
  }

  function switchToExhibitor() {
    setMode("exhibitor");
    setSelectedProfile(null);
    setMessage("");
    setError("");
    if (profiles.length === 0) {
      setLoadingProfiles(true);
      api
        .get<{ profiles: ExhibitorProfile[] }>("/exhibitors")
        .then((body) => setProfiles(body.profiles))
        .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load exhibitors."))
        .finally(() => setLoadingProfiles(false));
    }
  }

  function pickExhibitor(p: ExhibitorProfile) {
    setSelectedProfile(p);
    setMessage("");
    loadExhibitor(p.id, formKey);
  }

  function toggleGlobal(key: string) {
    setGlobalLocked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function toggleExhibitor(key: string) {
    setExhibitorLocked((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function saveGlobal() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.put(`/admin/mandatory-form-locks/global`, { formKey, lockedFieldKeys: globalLocked }, { silent: true });
      setMessage("Global lock settings saved.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save global locks.");
    } finally {
      setSaving(false);
    }
  }

  async function saveExhibitor() {
    if (!selectedProfile) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.put(`/admin/mandatory-form-locks/${selectedProfile.id}`, { formKey, lockedFieldKeys: exhibitorLocked }, { silent: true });
      setMessage(`Lock settings saved for ${selectedProfile.display_name}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save locks.");
    } finally {
      setSaving(false);
    }
  }

  const profileColumns: DataTableColumn<ExhibitorProfile>[] = [
    { key: "display_name", label: "Company" },
    { key: "legal_name", label: "Legal Name" },
    { key: "company_email", label: "Email", render: (p) => p.company_email || "—" },
    { key: "profile_status", label: "Status" }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Mandatory Form Field Locks</h1>
        <p className="content-subtitle">
          Lock specific fields on any mandatory form so exhibitors can no longer edit them — either for one company, or for everyone at once.
        </p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}
      {message && <div className="alert alert-success mb-3">{message}</div>}

      <div className="card mb-3">
        <div className="card-body d-flex" style={{ gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ marginBottom: 0, maxWidth: 320 }}>
            <label className="form-label">Form</label>
            <select className="form-control form-select" value={formKey} onChange={(e) => setFormKey(e.target.value)}>
              {FORM_KEYS.map((k) => (
                <option key={k} value={k}>
                  {FORM_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className={`btn ${mode === "global" ? "btn-primary" : "btn-outline-primary"}`} onClick={switchToGlobal}>
              <i className="bx bx-globe" /> Global (All Exhibitors)
            </button>
            <button type="button" className={`btn ${mode === "exhibitor" ? "btn-primary" : "btn-outline-primary"}`} onClick={switchToExhibitor}>
              <i className="bx bx-buildings" /> This Exhibitor Only
            </button>
          </div>
        </div>
      </div>

      {mode === "global" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Globally Locked Fields — {FORM_LABELS[formKey]}</span>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <p className="text-small text-muted mb-3">
                  Checked fields are locked for <strong>every exhibitor</strong> on this form, immediately.
                </p>
                <div className="grid grid-2" style={{ gap: "0.75rem" }}>
                  {fields.map((f) => (
                    <label key={f.key} className="d-flex align-center gap-2 text-small" style={{ fontWeight: 400, cursor: "pointer" }}>
                      <input type="checkbox" checked={globalLocked.includes(f.key)} onChange={() => toggleGlobal(f.key)} />
                      {f.label}
                      {f.kind === "action" && <span className="text-xs text-muted">(blocks add/remove)</span>}
                    </label>
                  ))}
                </div>
                <button type="button" className="btn btn-primary mt-3" onClick={saveGlobal} disabled={saving}>
                  {saving ? "Saving…" : "Save Global Locks"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {mode === "exhibitor" && !selectedProfile && (
        <DataTable
          columns={profileColumns}
          rows={profiles}
          keyField={(p) => p.id}
          loading={loadingProfiles}
          searchPlaceholder="Search exhibitors…"
          emptyMessage="No exhibitors found."
          actions={(p) => (
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => pickExhibitor(p)}>
              Select
            </button>
          )}
        />
      )}

      {mode === "exhibitor" && selectedProfile && (
        <div className="card">
          <div className="card-header d-flex justify-between align-center">
            <span className="card-title">
              {selectedProfile.display_name} — {FORM_LABELS[formKey]}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedProfile(null)}>
              <i className="bx bx-chevron-left" /> Change Exhibitor
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="spinner" />
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Current Value</th>
                        <th>Lock for this exhibitor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((f) => {
                        const lockedGlobally = globalLockedForExhibitor.includes(f.key);
                        return (
                          <tr key={f.key}>
                            <td className="text-small">
                              {f.label}
                              {f.kind === "action" && <div className="text-xs text-muted">(blocks add/remove)</div>}
                            </td>
                            <td className="text-small">{formatValue(values[f.key])}</td>
                            <td>
                              {lockedGlobally ? (
                                <span className="badge badge-secondary" title="Locked for every exhibitor — change this from Global mode instead">
                                  Locked globally
                                </span>
                              ) : (
                                <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                                  <input type="checkbox" checked={exhibitorLocked.includes(f.key)} onChange={() => toggleExhibitor(f.key)} />
                                </label>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn btn-primary mt-3" onClick={saveExhibitor} disabled={saving}>
                  {saving ? "Saving…" : "Save Locks for This Exhibitor"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
