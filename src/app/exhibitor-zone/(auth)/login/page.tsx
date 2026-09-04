"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../_lib/apiClient";
import { isAdminTier, useSession, type SessionUser } from "../../_lib/SessionProvider";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/login", { email, password });
      await refresh();
      const me = await api.get<{ user: SessionUser }>("/auth/me");
      router.push(isAdminTier(me.user.role) ? "/exhibitor-zone/admin/dashboard" : "/exhibitor-zone/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-logo">
        <img src="/images/exhibitor-zone-logo.jpg" alt="Exhibitor Zone" className="auth-logo-img" />
      </div>

      <h4 style={{ marginBottom: "0.375rem", color: "var(--ez-dark)", fontWeight: 700 }}>Welcome back! 👋</h4>
      <p className="text-muted text-small mb-3">Sign in to your account to continue</p>

      {error && (
        <div className="alert alert-danger mb-2" role="alert">
          <i className="bx bx-error-circle" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="loginForm" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <div className="d-flex justify-between align-center mb-1">
            <label className="form-label" htmlFor="password" style={{ margin: 0 }}>
              Password
            </label>
            <Link href="/exhibitor-zone/forgot-password" className="text-xs">
              Forgot Password?
            </Link>
          </div>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className="form-control"
              placeholder="··········"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: "2.75rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--ez-muted)",
                cursor: "pointer",
                padding: 0,
                fontSize: "1.125rem"
              }}
              tabIndex={-1}
              aria-label="Toggle password visibility"
            >
              <i className={`bx ${showPassword ? "bx-show" : "bx-hide"}`} />
            </button>
          </div>
        </div>

        <button id="loginBtn" type="submit" className="btn btn-primary w-100" style={{ marginTop: "0.5rem", padding: "0.625rem" }} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.9rem", color: "var(--ez-muted)" }}>
        New exhibitor?{" "}
        <Link href="/exhibitor-zone/register" style={{ fontWeight: 600 }}>
          Create an account
        </Link>
      </div>
    </div>
  );
}
