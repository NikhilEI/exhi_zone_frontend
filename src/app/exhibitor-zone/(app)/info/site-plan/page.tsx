"use client";

import { useState } from "react";

const PROGRAMME_DATES = [
  { date: "Wednesday, 06 May 2027", hours: "1000 - 1800 hrs" },
  { date: "Thursday, 07 May 2027", hours: "1000 - 1800 hrs" },
  { date: "Friday, 08 May 2027", hours: "1000 - 1600 hrs" }
];

const TABS = [
  { id: "floor", label: "Floor Plan", icon: "bx-map-pin" },
  { id: "schedule", label: "Programme & Dates", icon: "bx-calendar" },
  { id: "payment", label: "Payment Method", icon: "bx-credit-card" },
  { id: "insurance", label: "Theft & Insurance", icon: "bx-shield-quarter" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SitePlanPage() {
  const [activeTab, setActiveTab] = useState<TabId>("floor");

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Site Plan &amp; General Information</h1>
        <p className="content-subtitle">Floor plan access, programme dates, payment routes, and exhibit security guidelines</p>
      </div>

      <div className="card">
        <div className="card-header" style={{ borderBottom: "1px solid var(--ez-divider)", padding: 0 }}>
          <div className="d-flex" style={{ overflowX: "auto" }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
                style={{
                  padding: "1.15rem 1.5rem",
                  borderRadius: 0,
                  borderBottom: activeTab === tab.id ? "2px solid var(--ez-primary)" : "none",
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  whiteSpace: "nowrap"
                }}
              >
                <i className={`bx ${tab.icon}`} style={{ fontSize: "1.1rem" }} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body" style={{ padding: "2rem" }}>
          {activeTab === "floor" && (
            <div>
              <h2 className="fw-700 mb-3" style={{ fontSize: "1.25rem", color: "var(--ez-dark)" }}>
                Floor Plan Access
              </h2>
              <p className="text-small text-body mb-4">
                Exhibitors can view, download, or navigate the layout map of the event hall showing assigned booth
                placements.
              </p>

              <div
                style={{
                  background: "var(--ez-primary-light)",
                  border: "1px solid var(--ez-primary)",
                  borderRadius: "var(--ez-border-radius-lg)",
                  padding: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  maxWidth: 650
                }}
              >
                <div style={{ fontSize: "2.5rem", color: "var(--ez-primary)" }}>
                  <i className="bx bx-map-alt" />
                </div>
                <div>
                  <h4 className="fw-600 text-small mb-1" style={{ color: "var(--ez-dark)" }}>
                    Floor Plan — To Be Confirmed
                  </h4>
                  <p className="text-xs text-muted mb-0">
                    The floor plan showing reserved stalls and booth allocations will be published here closer to the
                    show. Please contact the organiser for the latest layout in the meantime.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="grid grid-2" style={{ gap: "2rem" }}>
              <div>
                <h3 className="fw-700 mb-3" style={{ fontSize: "1.15rem", color: "var(--ez-dark)" }}>
                  The Exhibition Programme
                </h3>
                <div className="table-wrapper mb-4">
                  <table className="table" style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Show Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PROGRAMME_DATES.map((row) => (
                        <tr key={row.date}>
                          <td className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                            {row.date}
                          </td>
                          <td className="text-small text-muted">{row.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="alert alert-info py-2 px-3" style={{ margin: 0 }}>
                  <i className="bx bx-time-five" />
                  <span className="text-xs">
                    <strong>Exhibition Timetable:</strong> Will be updated shortly.
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ background: "var(--ez-bg-body)", padding: "1.25rem", borderRadius: "var(--ez-border-radius-lg)", border: "1px solid var(--ez-border)" }}>
                  <h4 className="fw-700 text-small mb-2" style={{ color: "var(--ez-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <i className="bx bx-award" style={{ color: "var(--ez-primary)" }} />
                    Opening Ceremony
                  </h4>
                  <div className="text-xs text-muted d-flex" style={{ flexDirection: "column", gap: "0.4rem" }}>
                    <div>
                      <strong>Date &amp; Time:</strong> 06 May 2027 (Wednesday) — details to be confirmed
                    </div>
                    <div>
                      <strong>Venue:</strong> Bharat Mandapam, Pragati Maidan, New Delhi
                    </div>
                  </div>
                </div>

                <div style={{ background: "var(--ez-bg-body)", padding: "1.25rem", borderRadius: "var(--ez-border-radius-lg)", border: "1px solid var(--ez-border)" }}>
                  <h4 className="fw-700 text-small mb-2" style={{ color: "var(--ez-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <i className="bx bx-devices" style={{ color: "var(--ez-primary)" }} />
                    Conference Details
                  </h4>
                  <div className="text-xs text-muted d-flex" style={{ flexDirection: "column", gap: "0.4rem" }}>
                    <div>
                      <strong>Dates:</strong> 06-08 May 2027 (Wednesday-Friday)
                    </div>
                    <div>
                      <strong>Venue:</strong> Bharat Mandapam, Pragati Maidan, New Delhi
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div>
              <h2 className="fw-700 mb-2" style={{ fontSize: "1.25rem", color: "var(--ez-dark)" }}>
                Payment Methods
              </h2>
              <p className="text-small text-muted mb-4">
                Payments to the organiser must be completed via NEFT/RTGS. Ensure bank charges are covered on the
                remitter&apos;s account.
              </p>

              <div className="grid grid-2" style={{ gap: "2rem", alignItems: "flex-start" }}>
                <div style={{ background: "var(--ez-bg-body)", border: "1px solid var(--ez-border)", borderRadius: "var(--ez-border-radius-lg)", padding: "1.5rem" }}>
                  <h3 className="fw-700 text-small mb-3" style={{ color: "var(--ez-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <i className="bx bx-wallet" />
                    For NEFT / RTGS Transfer Details
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8125rem" }}>
                    {[
                      ["Account Name", "To be confirmed"],
                      ["Account Number", "To be confirmed"],
                      ["Bank Name", "To be confirmed"],
                      ["Branch Name", "To be confirmed"],
                      ["IFSC Code", "To be confirmed"],
                      ["SWIFT Code", "To be confirmed"]
                    ].map(([label, value], i, arr) => (
                      <div
                        key={label}
                        className="d-flex justify-between"
                        style={i < arr.length - 1 ? { borderBottom: "1px solid var(--ez-divider)", paddingBottom: "0.4rem" } : undefined}
                      >
                        <span className="text-muted">{label}:</span>
                        <strong style={{ color: "var(--ez-muted)" }}>{value}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="alert alert-warning py-3 px-4" style={{ margin: 0, borderRadius: "var(--ez-border-radius-lg)" }}>
                    <i className="bx bx-error-circle" style={{ fontSize: "1.3rem" }} />
                    <div>
                      <strong className="text-small">Late Orders &amp; Billing Notice</strong>
                      <p className="text-xs mt-1 mb-0" style={{ lineHeight: 1.4 }}>
                        All orders must be submitted with full payment including any late order surcharges. Orders
                        without full payment will not be processed or accepted.
                      </p>
                    </div>
                  </div>
                  <div className="alert alert-info py-2 px-3" style={{ margin: 0 }}>
                    <i className="bx bx-info-circle" />
                    <span className="text-xs">Bank charges on remitter&apos;s account. Please share the payment receipt with the finance desk.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "insurance" && (
            <div>
              <h2 className="fw-700 mb-3" style={{ fontSize: "1.25rem", color: "var(--ez-dark)" }}>
                Theft &amp; Exhibits Insurance Warning
              </h2>

              <div className="alert alert-warning" style={{ padding: "1.5rem", lineHeight: 1.6, fontSize: "0.875rem" }}>
                <div className="d-flex align-center gap-1 mb-3">
                  <i className="bx bx-shield-x" style={{ fontSize: "2rem" }} />
                  <strong className="fw-700" style={{ fontSize: "1.05rem" }}>
                    Important Security Guidelines
                  </strong>
                </div>
                <p className="mb-0">
                  As it is impossible to provide complete protection against theft, exhibitors should ensure that
                  their exhibits are properly insured. Exhibitors are responsible for their exhibits at all times,
                  and those will be at greatest risk during build-up and breakdown. The organiser will accept no
                  responsibility for losses or damages of any kind. Keep your passport, exhibit goods, laptop, and
                  other valuables under your strict supervision at all times.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
