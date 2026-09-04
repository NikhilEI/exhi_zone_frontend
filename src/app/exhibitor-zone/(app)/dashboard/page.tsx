"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../_lib/apiClient";

interface FormTemplate {
  id: number;
  name: string;
  slug: string;
}

interface FormSubmission {
  id: number;
  form_template_id: number;
  status: "draft" | "submitted" | "changes_requested" | "approved" | "rejected";
}

interface Order {
  id: number;
  order_number: string;
  currency: "INR" | "USD";
  grand_total: string;
  status: string;
  payment_status: string;
  created_at: string;
}

interface Pass {
  id: number;
  status: string;
}

interface MandatoryForm {
  id: number;
  status: "pending" | "in_progress" | "completed";
}

const QUICK_ACTIONS = [
  { href: "/exhibitor-zone/catalogue", icon: "bx-store", label: "Order Services", sub: "Browse equipment & fittings", bg: "var(--ez-primary-light)" },
  { href: "/exhibitor-zone/forms", icon: "bx-list-check", label: "Mandatory Forms", sub: "Compliance profiles & declarations", bg: "#e4f9d6" },
  { href: "/exhibitor-zone/passes", icon: "bx-id-card", label: "Badge Registry", sub: "Submit staff names & designations", bg: "#d0f6fd" },
  { href: "/exhibitor-zone/profile", icon: "bx-grid-alt", label: "Stall Allocation", sub: "View allocated booth scheme", bg: "#fff3cd" }
] as const;

export default function ExhibitorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [passesCount, setPassesCount] = useState(0);
  const [mandatoryForms, setMandatoryForms] = useState<MandatoryForm[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<{ mandatory: FormTemplate[]; additional: FormTemplate[] }>("/forms/templates").catch(() => ({ mandatory: [], additional: [] })),
      api.get<{ submissions: FormSubmission[] }>("/forms/submissions").catch(() => ({ submissions: [] })),
      api.get<{ orders: Order[] }>("/orders").catch(() => ({ orders: [] })),
      api.get<{ passes: Pass[] }>("/passes").catch(() => ({ passes: [] })),
      api.get<{ forms: MandatoryForm[] }>("/mandatory-forms").catch(() => ({ forms: [] }))
    ])
      .then(([templatesRes, submissionsRes, ordersRes, passesRes, mandatoryRes]) => {
        setTemplates(templatesRes.mandatory);
        setSubmissions(submissionsRes.submissions);
        setOrders(ordersRes.orders);
        setPassesCount(passesRes.passes.filter((p) => p.status === "issued" || p.status === "printed").length);
        setMandatoryForms(mandatoryRes.forms);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  const completedForms = submissions.filter((s) => s.status === "approved").length;
  const totalForms = templates.length;
  const isCompliant = completedForms === totalForms && totalForms > 0;
  const incompleteCount = totalForms - completedForms;
  const hasAlert = totalForms > 0 && completedForms < totalForms;

  const mandatoryCompletedCount = mandatoryForms.filter((f) => f.status === "completed").length;
  const mandatoryPendingCount = mandatoryForms.length - mandatoryCompletedCount;
  const hasMandatoryAlert = mandatoryForms.length > 0 && mandatoryPendingCount > 0;

  return (
    <>
      {hasMandatoryAlert && (
        <div className="alert alert-warning mb-3" role="alert" style={{ borderLeftWidth: "5px" }}>
          <i className="bx bx-error" style={{ fontSize: "1.25rem" }} />
          <div style={{ flex: 1 }}>
            <span className="fw-600">Mandatory Forms:</span> You have completed{" "}
            <strong>
              {mandatoryCompletedCount} of {mandatoryForms.length}
            </strong>{" "}
            mandatory exhibitor onboarding forms. These must be completed before you can proceed to the next stage.
          </div>
          <Link href="/exhibitor-zone/mandatory-forms" className="btn btn-warning btn-sm">
            Complete Forms
          </Link>
        </div>
      )}

      {hasAlert && (
        <div className="alert alert-warning mb-3" role="alert" style={{ borderLeftWidth: "5px" }}>
          <i className="bx bx-error" style={{ fontSize: "1.25rem" }} />
          <div style={{ flex: 1 }}>
            <span className="fw-600">Compliance Warning:</span> You have completed only{" "}
            <strong>
              {completedForms} of {totalForms}
            </strong>{" "}
            mandatory forms. Please complete your remaining forms to prevent stall suspension or badge printing delays.
          </div>
          <Link href="/exhibitor-zone/forms" className="btn btn-warning btn-sm">
            Complete Forms
          </Link>
        </div>
      )}

      {isCompliant && (
        <div className="alert alert-success mb-3" role="alert">
          <i className="bx bx-check-shield" style={{ fontSize: "1.25rem" }} />
          <span>
            <strong>100% Compliant:</strong> All mandatory event configuration tasks and compliance forms have been approved by the organizer. Thank you!
          </span>
        </div>
      )}

      <div className="content-header">
        <h1 className="content-title">Dashboard</h1>
        <p className="content-subtitle">Wellness India Expo 2027 — Welcome back! Here&apos;s your activity overview.</p>
      </div>

      <div className="grid grid-4 mb-3">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Mandatory Forms</div>
            <div className="stat-card-value">
              {completedForms}/{totalForms}
            </div>
            <div className="stat-card-change text-small">{incompleteCount > 0 ? `${incompleteCount} pending approval` : "All Approved ✓"}</div>
          </div>
          <div className="stat-card-icon" style={{ background: "var(--ez-primary-light)" }}>
            <i className="bx bx-list-check" style={{ color: "var(--ez-primary)" }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Orders Placed</div>
            <div className="stat-card-value">{orders.length}</div>
            <div className="stat-card-change text-small">Total: {orders.filter((o) => o.status === "confirmed").length} approved</div>
          </div>
          <div className="stat-card-icon" style={{ background: "#e4f9d6" }}>
            <i className="bx bx-receipt" style={{ color: "var(--ez-primary)" }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Staff Passes Issued</div>
            <div className="stat-card-value">{passesCount}</div>
            <div className="stat-card-change text-small">Allocated via badge registry</div>
          </div>
          <div className="stat-card-icon" style={{ background: "#d0f6fd" }}>
            <i className="bx bx-id-card" style={{ color: "var(--ez-primary)" }} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-card-label">Overall Progress</div>
            <div className="stat-card-value">{totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0}%</div>
            <div className="stat-card-change text-small">Forms compliance rating</div>
          </div>
          <div className="stat-card-icon" style={{ background: "#fff3cd" }}>
            <i className="bx bx-trending-up" style={{ color: "var(--ez-primary)" }} />
          </div>
        </div>
      </div>

      <div className="grid grid-2 mb-3" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">🎯 Onboarding Checklist</span>
          </div>
          <div className="card-body">
            <div className="progress mb-3">
              <div className="progress-bar" style={{ width: `${totalForms > 0 ? (completedForms / totalForms) * 100 : 0}%` }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {templates.map((temp) => {
                const sub = submissions.find((s) => s.form_template_id === temp.id);
                const isApproved = sub?.status === "approved";
                const hasSubmitted = sub?.status === "submitted";

                return (
                  <div key={temp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <i
                        className={`bx ${isApproved ? "bx-check-circle" : hasSubmitted ? "bx-time-five" : "bx-circle"}`}
                        style={{ fontSize: "1.25rem", color: isApproved ? "var(--ez-success)" : hasSubmitted ? "var(--ez-warning)" : "var(--ez-border)" }}
                      />
                      <span className="text-small" style={{ color: isApproved ? "var(--ez-dark)" : undefined }}>
                        {temp.name}
                      </span>
                    </div>
                    <span className={`badge badge-${isApproved ? "success" : hasSubmitted ? "warning" : "secondary"}`} style={{ marginLeft: "auto" }}>
                      {sub?.status || "not_started"}
                    </span>
                  </div>
                );
              })}
              {templates.length === 0 && <p className="text-muted text-small mb-0">No mandatory forms configured yet.</p>}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Quick Management Portal</span>
          </div>
          <div className="card-body">
            <div className="grid grid-2" style={{ gap: "1rem" }}>
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href} className="card card-interactive" style={{ padding: "1.25rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: action.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                    <i className={`bx ${action.icon}`} style={{ fontSize: "1.25rem", color: "var(--ez-primary)" }} />
                  </div>
                  <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                    {action.label}
                  </div>
                  <div className="text-xs text-muted">{action.sub}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Service Orders</span>
          <Link href="/exhibitor-zone/orders" className="btn btn-ghost btn-sm">
            View All
          </Link>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Placement Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href="/exhibitor-zone/orders" className="fw-600" style={{ color: "var(--ez-primary)" }}>
                      {o.order_number}
                    </Link>
                  </td>
                  <td className="fw-600" style={{ color: "var(--ez-dark)" }}>
                    {o.currency === "INR" ? "₹" : "$"}
                    {Number(o.grand_total).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge badge-${o.status === "confirmed" ? "success" : o.status === "pending" ? "warning" : "danger"}`}>{o.status}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${o.payment_status === "paid" ? "success" : "danger"}`}>{o.payment_status}</span>
                  </td>
                  <td className="text-muted text-small">
                    {new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }} className="text-muted text-small">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
