"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../_lib/apiClient";
import { useSession } from "../../_lib/SessionProvider";
import StatusBadge from "../../_components/StatusBadge";

interface Profile {
  profile_status: string;
  legal_name: string;
  display_name: string;
  company_type: string | null;
  industry_type: string | null;
  website: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  is_verified: number;
  gst_number: string | null;
  pan_number: string | null;
}

interface Allocation {
  stall_number: string;
  hall: string | null;
  area_sqm: string | null;
}

export default function ProfilePage() {
  const { user } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allocation, setAllocation] = useState<Allocation | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"loading" | "idle" | "saving">("loading");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get<{ profile: Profile }>("/exhibitors/my-profile"), api.get<{ allocation: Allocation | null }>("/stalls/my-allocation").catch(() => ({ allocation: null }))])
      .then(([profileRes, allocationRes]) => {
        setProfile(profileRes.profile);
        setAllocation(allocationRes.allocation);
        setForm({
          displayName: profileRes.profile.display_name || "",
          industryType: profileRes.profile.industry_type || "",
          website: profileRes.profile.website || "",
          addressLine1: profileRes.profile.address_line1 || "",
          addressLine2: profileRes.profile.address_line2 || "",
          city: profileRes.profile.city || "",
          state: profileRes.profile.state || "",
          postalCode: profileRes.profile.postal_code || "",
          country: profileRes.profile.country || "",
          phone: profileRes.profile.phone || "",
          email: profileRes.profile.email || ""
        });
        setStatus("idle");
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load profile.");
        setStatus("idle");
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    setMessage("");
    try {
      await api.patch("/exhibitors/my-profile", form);
      setMessage("Company profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile.");
    } finally {
      setStatus("idle");
    }
  }

  const readOnly = user?.role === "exhibitor_staff";

  if (status === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Exhibitor Company Profile</h1>
        <p className="content-subtitle">Manage your company details and view your booth allocation</p>
      </div>

      {!profile ? (
        <div className="alert alert-danger">{error || "Profile not found."}</div>
      ) : (
        <div className="grid grid-2" style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">{profile.legal_name}</span>
              <StatusBadge status={profile.profile_status} />
            </div>
            <div className="card-body">
              {message && <div className="alert alert-success mb-3">{message}</div>}
              {error && <div className="alert alert-danger mb-3">{error}</div>}

              <form noValidate onSubmit={handleSubmit}>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input className="form-control" value={form.displayName || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input className="form-control" value={form.industryType || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, industryType: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-control" value={form.website || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address Line 1</label>
                  <input className="form-control" value={form.addressLine1 || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address Line 2</label>
                  <input className="form-control" value={form.addressLine2 || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} />
                </div>
                <div className="grid grid-3">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-control" value={form.city || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-control" value={form.state || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Postal Code</label>
                    <input className="form-control" value={form.postalCode || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-control" value={form.country || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" value={form.phone || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email || ""} disabled={readOnly} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>

                {!readOnly ? (
                  <button type="submit" className="btn btn-primary" disabled={status === "saving"}>
                    {status === "saving" ? "Saving..." : "Save Changes"}
                  </button>
                ) : (
                  <p className="text-xs text-muted mb-0">Staff accounts have view-only access. Contact your company admin to make changes.</p>
                )}
              </form>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Booth Scheme Allocation</span>
              </div>
              {allocation ? (
                <div className="card-body" style={{ textAlign: "center", padding: "2rem" }}>
                  <div style={{ fontSize: "3rem", color: "var(--ez-primary)", marginBottom: "0.75rem" }}>
                    <i className="bx bx-grid-alt" />
                  </div>
                  <h3 style={{ color: "var(--ez-dark)" }}>Stall No: {allocation.stall_number}</h3>
                  <p className="text-small text-muted mb-3">
                    {allocation.hall || "Hall TBD"}
                    {allocation.area_sqm ? ` · ${allocation.area_sqm} sqm` : ""}
                  </p>
                  <span className="badge badge-success">Allocated</span>
                </div>
              ) : (
                <div className="card-body" style={{ textAlign: "center", padding: "2rem" }}>
                  <p className="text-muted text-small mb-0">No stall has been allocated yet.</p>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">Compliance</span>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="d-flex justify-between">
                  <span className="text-small text-muted">Company Verified</span>
                  <span className={`badge badge-${profile.is_verified ? "success" : "secondary"}`}>{profile.is_verified ? "Yes" : "No"}</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-small text-muted">GST Number</span>
                  <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                    {profile.gst_number || "Not provided"}
                  </span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-small text-muted">PAN Number</span>
                  <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                    {profile.pan_number || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
