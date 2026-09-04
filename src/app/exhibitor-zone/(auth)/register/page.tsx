"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, type FieldError } from "../../_lib/apiClient";

const COMPANY_TYPES = [
  ["private_limited", "Private Limited"],
  ["public_limited", "Public Limited"],
  ["partnership", "Partnership"],
  ["llp", "LLP"],
  ["proprietorship", "Proprietorship"],
  ["ngo", "NGO"],
  ["government", "Government"],
  ["other", "Other"]
];

const initialForm = {
  companyLegalName: "",
  companyDisplayName: "",
  companyType: "private_limited",
  industryType: "",
  website: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  companyPhone: "",
  companyEmail: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: ""
};

function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="text-xs" style={{ color: "var(--ez-danger)", display: "block", marginTop: "0.25rem" }}>
      {message}
    </span>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function setField<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setErrors({});
    setSubmitting(true);

    try {
      await api.post("/auth/register", form);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
        if (err.fieldErrors) {
          const next: Record<string, string> = {};
          err.fieldErrors.forEach((fe: FieldError) => {
            next[fe.field] = fe.message;
          });
          setErrors(next);
        }
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
        <h4 style={{ marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Registration submitted</h4>
        <p className="text-muted text-small mb-3">Your account is pending organiser approval. We&apos;ll email you once it&apos;s reviewed.</p>
        <button type="button" className="btn btn-primary w-100" onClick={() => router.push("/exhibitor-zone/login")}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="auth-card" style={{ maxWidth: 640 }}>
      <div className="auth-logo">
        <img src="/images/exhibitor-zone-logo.jpg" alt="Exhibitor Zone" className="auth-logo-img" />
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ marginBottom: "0.375rem", color: "var(--ez-dark)", fontWeight: 700 }}>Register Your Company</h4>
        <p className="text-muted text-small">Create your exhibitor account — approval typically takes 1-2 business days.</p>
      </div>

      {apiError && (
        <div className="alert alert-danger mb-2">
          <i className="bx bx-error-circle" />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
          Company Details
        </p>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Legal Name</label>
            <input className="form-control" value={form.companyLegalName} onChange={(e) => setField("companyLegalName", e.target.value)} required />
            <FieldErrorText message={errors.companyLegalName} />
          </div>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input className="form-control" value={form.companyDisplayName} onChange={(e) => setField("companyDisplayName", e.target.value)} required />
            <FieldErrorText message={errors.companyDisplayName} />
          </div>
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Company Type</label>
            <select className="form-control form-select" value={form.companyType} onChange={(e) => setField("companyType", e.target.value)}>
              {COMPANY_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Industry</label>
            <input className="form-control" value={form.industryType} onChange={(e) => setField("industryType", e.target.value)} placeholder="e.g. Fitness, Nutrition" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Website</label>
          <input className="form-control" value={form.website} onChange={(e) => setField("website", e.target.value)} placeholder="https://" />
        </div>

        <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", margin: "1.25rem 0 0.75rem" }}>
          Address
        </p>
        <div className="form-group">
          <label className="form-label">Address Line 1</label>
          <input className="form-control" value={form.addressLine1} onChange={(e) => setField("addressLine1", e.target.value)} required />
          <FieldErrorText message={errors.addressLine1} />
        </div>
        <div className="form-group">
          <label className="form-label">Address Line 2</label>
          <input className="form-control" value={form.addressLine2} onChange={(e) => setField("addressLine2", e.target.value)} />
        </div>
        <div className="grid grid-3">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-control" value={form.city} onChange={(e) => setField("city", e.target.value)} required />
            <FieldErrorText message={errors.city} />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <input className="form-control" value={form.state} onChange={(e) => setField("state", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Postal Code</label>
            <input className="form-control" value={form.postalCode} onChange={(e) => setField("postalCode", e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Country</label>
          <input className="form-control" value={form.country} onChange={(e) => setField("country", e.target.value)} required />
          <FieldErrorText message={errors.country} />
        </div>

        <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", margin: "1.25rem 0 0.75rem" }}>
          Company Contact
        </p>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Company Phone</label>
            <input className="form-control" value={form.companyPhone} onChange={(e) => setField("companyPhone", e.target.value)} required />
            <FieldErrorText message={errors.companyPhone} />
          </div>
          <div className="form-group">
            <label className="form-label">Company Email</label>
            <input type="email" className="form-control" value={form.companyEmail} onChange={(e) => setField("companyEmail", e.target.value)} required />
            <FieldErrorText message={errors.companyEmail} />
          </div>
        </div>

        <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", margin: "1.25rem 0 0.75rem" }}>
          Your Account
        </p>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-control" value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} required />
            <FieldErrorText message={errors.firstName} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-control" value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} required />
            <FieldErrorText message={errors.lastName} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Your Email (used to log in)</label>
          <input type="email" className="form-control" value={form.email} onChange={(e) => setField("email", e.target.value)} required />
          <FieldErrorText message={errors.email} />
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={form.password} onChange={(e) => setField("password", e.target.value)} minLength={8} required />
            {errors.password ? <FieldErrorText message={errors.password} /> : <span className="text-xs text-muted" style={{ display: "block", marginTop: "0.25rem" }}>At least 8 characters, with a letter and a number.</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-100" style={{ marginTop: "0.5rem", padding: "0.625rem" }} disabled={submitting}>
          {submitting ? "Submitting..." : "Register"}
        </button>
      </form>

      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--ez-muted)" }}>
        Already have an account?{" "}
        <Link href="/exhibitor-zone/login" style={{ fontWeight: 600 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
