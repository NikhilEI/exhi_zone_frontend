"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api, ApiError } from "../../_lib/apiClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/password/forgot", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <img src="/images/exhibitor-zone-logo.jpg" alt="Exhibitor Zone" className="auth-logo-img" />
      </div>

      {!sent ? (
        <>
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ marginBottom: "0.375rem", color: "var(--ez-dark)", fontWeight: 700 }}>Forgot Password? 🔒</h4>
            <p className="text-muted text-small">Enter your email and we&apos;ll send you a reset link.</p>
          </div>

          {error && (
            <div className="alert alert-danger mb-2">
              <i className="bx bx-error-circle" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="forgotPasswordForm">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input id="email" type="email" className="form-control" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>

            <button id="sendResetBtn" type="submit" className="btn btn-primary w-100" style={{ padding: "0.625rem" }} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}>
            <Link href="/exhibitor-zone/login" className="d-flex align-center gap-1" style={{ justifyContent: "center" }}>
              <i className="bx bx-arrow-back" />
              Back to Login
            </Link>
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📧</div>
          <h4 style={{ marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Check your inbox!</h4>
          <p className="text-muted text-small mb-3">
            We&apos;ve sent a password reset link to <strong>{email}</strong>. The link expires in 30 minutes.
          </p>
          <Link href="/exhibitor-zone/login" className="btn btn-outline-primary w-100" id="backToLoginBtn">
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}
