"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";

interface DashboardData {
  companies: { pending: number; approved: number; rejected: number; suspended: number };
  orders: { total: number; revenue: number; unpaid: number };
  stalls: { total: number; booked: number; available: number; held: number; blocked: number };
  passesIssued: number;
  formsPendingReview: number;
}

interface Submission {
  id: number;
  company_name: string;
  template_name: string;
  status: string;
  created_at: string;
}

interface Profile {
  id: number;
  display_name: string;
  profile_status: string;
  created_at: string;
}

interface Stall {
  id: number;
  stall_number: string;
  status: "available" | "booked" | "held" | "blocked";
}

function SummaryCard({ label, value, sub, icon, iconColor, iconBg }: { label: string; value: string | number; sub: string; icon: string; iconColor: string; iconBg: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        <div className="text-xs text-muted mt-1">{sub}</div>
      </div>
      <div className="stat-card-icon" style={{ background: iconBg }}>
        <i className={`bx ${icon}`} style={{ fontSize: "1.5rem", color: iconColor }} />
      </div>
    </div>
  );
}

function StallLegend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
      <span className="text-small text-muted">{label}</span>
      <span className="fw-600 text-small" style={{ color: "var(--ez-dark)", marginLeft: "auto" }}>
        {count}
      </span>
    </div>
  );
}

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>("/admin/dashboard"),
      api.get<{ submissions: Submission[] }>("/forms/submissions?status=submitted").catch(() => ({ submissions: [] })),
      api.get<{ profiles: Profile[] }>("/exhibitors").catch(() => ({ profiles: [] })),
      api.get<{ stalls: Stall[] }>("/stalls").catch(() => ({ stalls: [] }))
    ])
      .then(([dashboard, submissionsRes, profilesRes, stallsRes]) => {
        setData(dashboard);
        setSubmissions(submissionsRes.submissions);
        setProfiles(profilesRes.profiles);
        setStalls(stallsRes.stalls);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard."));
  }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
        <div className="spinner" />
      </div>
    );
  }

  const stallsBookedPct = data.stalls.total > 0 ? Math.round((data.stalls.booked / data.stalls.total) * 100) : 0;
  const revenueFmt = data.orders.revenue >= 100000 ? `₹${(data.orders.revenue / 100000).toFixed(1)}L` : money(data.orders.revenue);
  const paidTotal = Math.max(0, data.orders.total - data.orders.unpaid);
  const paidRevenuePct = data.orders.total > 0 ? Math.round((paidTotal / data.orders.total) * 100) : 0;
  const unpaidRevenuePct = 100 - paidRevenuePct;

  return (
    <>
      <div className="content-header d-flex justify-between align-center">
        <div>
          <h1 className="content-title">Admin Dashboard</h1>
          <p className="content-subtitle">Wellness India Expo 2027 — Real-time operations overview</p>
        </div>
        <Link href="/exhibitor-zone/admin/events" className="btn btn-primary btn-sm">
          <i className="bx bx-calendar-plus" />
          Manage Events
        </Link>
      </div>

      <div className="grid grid-4 mb-3">
        <SummaryCard
          label="Total Exhibitors"
          value={data.companies.pending + data.companies.approved + data.companies.rejected + data.companies.suspended}
          sub={`${data.companies.pending} pending approval`}
          icon="bx-buildings"
          iconColor="var(--ez-primary)"
          iconBg="var(--ez-primary-light)"
        />
        <SummaryCard
          label="Stalls Booked"
          value={`${stallsBookedPct}%`}
          sub={`${data.stalls.booked}/${data.stalls.total} booked`}
          icon="bx-grid-alt"
          iconColor="#3a7d18"
          iconBg="var(--ez-success-light)"
        />
        <SummaryCard label="Orders Revenue" value={revenueFmt} sub={`${data.orders.total} orders placed`} icon="bx-rupee" iconColor="#016a80" iconBg="var(--ez-info-light)" />
        <SummaryCard
          label="Pending Approvals"
          value={data.companies.pending}
          sub={`${data.formsPendingReview} forms awaiting review`}
          icon="bx-check-shield"
          iconColor="#806200"
          iconBg="var(--ez-warning-light)"
        />
      </div>

      <div className="grid mb-3" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Approvals Queue</span>
            <div className="d-flex gap-1 align-center">
              <span className="badge badge-danger">{submissions.length} pending</span>
              <Link href="/exhibitor-zone/admin/forms" className="btn btn-ghost btn-sm">
                View All
              </Link>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Form</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 5).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="d-flex align-center gap-1">
                        <div className="avatar avatar-sm" style={{ background: `hsl(${row.company_name.charCodeAt(0) * 5}, 65%, 55%)` }}>
                          {row.company_name[0]}
                        </div>
                        <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                          {row.company_name}
                        </span>
                      </div>
                    </td>
                    <td className="text-small">{row.template_name}</td>
                    <td className="text-muted text-xs">{new Date(row.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                    <td>
                      <span className="badge badge-warning">Pending</span>
                    </td>
                    <td>
                      <Link href="/exhibitor-zone/admin/forms" className="btn btn-sm btn-primary">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-muted text-small" style={{ textAlign: "center", padding: "2rem" }}>
                      No submissions awaiting review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">🗺️ Stall Status</span>
            <Link href="/exhibitor-zone/admin/stalls" className="btn btn-ghost btn-sm">
              Full Grid
            </Link>
          </div>
          <div className="card-body">
            {stalls.length > 0 ? (
              <>
                <div className="stall-grid" style={{ gridTemplateColumns: "repeat(8, 1fr)", gap: "0.375rem", marginBottom: "1.25rem" }}>
                  {stalls.slice(0, 40).map((s) => (
                    <div key={s.id} className={`stall-cell ${s.status}`} title={`${s.stall_number} — ${s.status}`} style={{ fontSize: "0.6rem", padding: "0.375rem 0" }}>
                      {s.stall_number}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <StallLegend color="var(--ez-success)" label="Available" count={data.stalls.available} />
                  <StallLegend color="var(--ez-primary)" label="Booked" count={data.stalls.booked} />
                  <StallLegend color="var(--ez-warning)" label="Held" count={data.stalls.held} />
                  <StallLegend color="var(--ez-border)" label="Blocked" count={data.stalls.blocked} />
                </div>
              </>
            ) : (
              <p className="text-muted text-small mb-0" style={{ textAlign: "center", padding: "1.5rem 0" }}>
                No stalls configured yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid mb-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏭 Recent Exhibitors</span>
            <Link href="/exhibitor-zone/admin/companies" className="btn btn-ghost btn-sm">
              View CRM
            </Link>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Registered</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {profiles.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                      {p.display_name}
                    </td>
                    <td className="text-muted text-xs">{new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td>
                      <span className={`badge badge-${p.profile_status === "approved" ? "success" : p.profile_status === "pending" ? "warning" : "danger"}`}>{p.profile_status}</span>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-muted text-small" style={{ textAlign: "center", padding: "2rem" }}>
                      No exhibitors registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">💰 Order Payment Status</span>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: "1rem" }}>
              <div className="d-flex justify-between align-center mb-1">
                <span className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                  Paid Orders
                </span>
                <span className="text-small text-muted">{paidTotal}</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${paidRevenuePct}%` }} />
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <div className="d-flex justify-between align-center mb-1">
                <span className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                  Unpaid Orders
                </span>
                <span className="text-small text-muted">{data.orders.unpaid}</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${unpaidRevenuePct}%`, background: "var(--ez-danger)" }} />
              </div>
            </div>
            <p className="text-center text-muted text-small mb-0">{revenueFmt} total revenue across {data.orders.total} orders</p>
          </div>
        </div>
      </div>
    </>
  );
}
