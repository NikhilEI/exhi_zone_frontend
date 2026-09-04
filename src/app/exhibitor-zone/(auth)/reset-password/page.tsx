"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "../../_lib/apiClient";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("This reset link is missing its token. Please request a new one.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/password/reset", { token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <img src="/images/exhibitor-zone-logo.jpg" alt="Exhibitor Zone" className="auth-logo-img" />
      </div>

      {!done ? (
        <>
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ marginBottom: "0.375rem", color: "var(--ez-dark)", fontWeight: 700 }}>Set a New Password</h4>
            <p className="text-muted text-small">Choose a new password for your account.</p>
          </div>

          {error && (
            <div className="alert alert-danger mb-2">
              <i className="bx bx-error-circle" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                New Password
              </label>
              <input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input id="confirmPassword" type="password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required />
            </div>

            <button type="submit" className="btn btn-primary w-100" style={{ padding: "0.625rem" }} disabled={submitting}>
              {submitting ? "Resetting..." : "Reset Password"}
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
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h4 style={{ marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Password reset</h4>
          <p className="text-muted text-small mb-3">Your password has been updated. You can now sign in with your new password.</p>
          <Link href="/exhibitor-zone/login" className="btn btn-primary w-100">
            Back to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
