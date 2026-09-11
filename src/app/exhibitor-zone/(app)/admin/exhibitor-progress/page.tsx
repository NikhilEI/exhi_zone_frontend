"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import StatusBadge from "../../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface FormEntry {
  formKey: string;
  name: string;
  status: string;
  completedAt: string | null;
}

interface ExhibitorProgress {
  profileId: number;
  companyName: string;
  profileStatus: string;
  totalForms: number;
  completedForms: number;
  inProgressForms: number;
  pendingForms: number;
  completionPct: number;
  forms: FormEntry[];
}

interface FormStat {
  formKey: string;
  name: string;
  applicable: number;
  completed: number;
  inProgress: number;
  pending: number;
}

interface Summary {
  totalExhibitors: number;
  fullyCompleted: number;
  notStarted: number;
  avgCompletionPct: number;
}

interface ProgressResponse {
  exhibitors: ExhibitorProgress[];
  formStats: FormStat[];
  summary: Summary;
}

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? "var(--ez-success)" : pct === 0 ? "var(--ez-muted)" : "var(--ez-primary)";
  return (
    <div className="d-flex align-center gap-2">
      <div className="progress" style={{ flex: 1, minWidth: 80 }}>
        <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-muted" style={{ minWidth: 32, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

function ExhibitorLink({ e }: { e: ExhibitorProgress }) {
  return (
    <Link
      href={`/exhibitor-zone/admin/exhibitor-progress/${e.profileId}?company=${encodeURIComponent(e.companyName)}`}
      className="d-flex justify-between align-center text-small"
      style={{ padding: "0.375rem 0", borderBottom: "1px solid var(--ez-divider, #eee)" }}
    >
      <span>{e.companyName}</span>
      <i className="bx bx-chevron-right text-muted" />
    </Link>
  );
}

// The drill-down shown when a "Completion by Form" row is expanded — two
// segregated lists (filled / not filled) for that one form, each exhibitor
// linking straight to their own Exhibitor Progress detail page where the
// admin can open and check (or edit) that exact form submission.
function FormExhibitorBreakdown({ formKey, exhibitors }: { formKey: string; exhibitors: ExhibitorProgress[] }) {
  const { filled, notFilled } = getFormBreakdown(exhibitors, formKey);
  return (
    <div className="grid grid-2" style={{ gap: "1.5rem" }}>
      <div>
        <div className="text-small fw-600 mb-2" style={{ color: "var(--ez-success)" }}>
          <i className="bx bx-check-circle" /> Filled ({filled.length})
        </div>
        {filled.length === 0 ? (
          <p className="text-xs text-muted">No exhibitor has filled this form yet.</p>
        ) : (
          filled.map((e) => <ExhibitorLink key={e.profileId} e={e} />)
        )}
      </div>
      <div>
        <div className="text-small fw-600 mb-2" style={{ color: "var(--ez-danger)" }}>
          <i className="bx bx-x-circle" /> Not Filled ({notFilled.length})
        </div>
        {notFilled.length === 0 ? (
          <p className="text-xs text-muted">Everyone this form applies to has filled it.</p>
        ) : (
          notFilled.map((e) => <ExhibitorLink key={e.profileId} e={e} />)
        )}
      </div>
    </div>
  );
}

// Splits every exhibitor into "filled" vs "not filled" for one form key —
// an exhibitor with no entry for this formKey simply doesn't have this form
// apply to them (e.g. Shell Space exhibitors have no Booth Design Submission
// row) and is excluded from both lists rather than counted as "not filled".
function getFormBreakdown(exhibitors: ExhibitorProgress[], formKey: string) {
  const filled: ExhibitorProgress[] = [];
  const notFilled: ExhibitorProgress[] = [];
  for (const e of exhibitors) {
    const entry = e.forms.find((f) => f.formKey === formKey);
    if (!entry) continue;
    if (entry.status === "completed") filled.push(e);
    else notFilled.push(e);
  }
  return { filled, notFilled };
}

export default function AdminExhibitorProgressPage() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedFormKey, setExpandedFormKey] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ProgressResponse>("/mandatory-forms/admin/exhibitor-progress")
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load exhibitor progress."))
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<ExhibitorProgress>[] = [
    {
      key: "companyName",
      label: "Company",
      render: (e) => (
        <Link href={`/exhibitor-zone/admin/exhibitor-progress/${e.profileId}?company=${encodeURIComponent(e.companyName)}`} className="fw-600">
          {e.companyName}
        </Link>
      )
    },
    { key: "profileStatus", label: "Profile", render: (e) => <StatusBadge status={e.profileStatus} /> },
    {
      key: "completedForms",
      label: "Forms Completed",
      value: (e) => e.completedForms,
      render: (e) => (
        <span className="text-small">
          {e.completedForms} / {e.totalForms}
        </span>
      )
    },
    { key: "completionPct", label: "Progress", render: (e) => <ProgressBar pct={e.completionPct} /> }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Exhibitor Progress</h1>
        <p className="content-subtitle">Mandatory form completion across every exhibitor for this event</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {data && (
        <>
          <div className="grid grid-2 mb-3" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div className="text-small text-muted mb-1">Total Exhibitors</div>
              <div className="fw-700" style={{ fontSize: "1.5rem", color: "var(--ez-dark)" }}>
                {data.summary.totalExhibitors}
              </div>
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div className="text-small text-muted mb-1">Fully Completed</div>
              <div className="fw-700" style={{ fontSize: "1.5rem", color: "var(--ez-success)" }}>
                {data.summary.fullyCompleted}
              </div>
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div className="text-small text-muted mb-1">Not Started</div>
              <div className="fw-700" style={{ fontSize: "1.5rem", color: "var(--ez-danger)" }}>
                {data.summary.notStarted}
              </div>
            </div>
            <div className="card" style={{ padding: "1.25rem" }}>
              <div className="text-small text-muted mb-1">Avg. Completion</div>
              <div className="fw-700" style={{ fontSize: "1.5rem", color: "var(--ez-primary)" }}>
                {data.summary.avgCompletionPct}%
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">
              <span className="card-title">Completion by Form</span>
            </div>
            <p className="text-xs text-muted" style={{ padding: "0 1.25rem", marginTop: "0.5rem", marginBottom: 0 }}>
              Click a form to see which exhibitors have filled it and which haven&apos;t.
            </p>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Form</th>
                    <th>Applicable</th>
                    <th>Completed</th>
                    <th>In Progress</th>
                    <th>Pending</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.formStats.map((f) => {
                    const expanded = expandedFormKey === f.formKey;
                    return (
                      <Fragment key={f.formKey}>
                        <tr style={{ cursor: "pointer" }} onClick={() => setExpandedFormKey(expanded ? null : f.formKey)}>
                          <td style={{ width: 24 }}>
                            <i className={`bx ${expanded ? "bx-chevron-down" : "bx-chevron-right"}`} />
                          </td>
                          <td className="text-small fw-600" style={{ color: "var(--ez-dark)" }}>
                            {f.name}
                          </td>
                          <td className="text-small">{f.applicable}</td>
                          <td className="text-small">{f.completed}</td>
                          <td className="text-small">{f.inProgress}</td>
                          <td className="text-small">{f.pending}</td>
                          <td style={{ minWidth: 160 }}>
                            <ProgressBar pct={f.applicable > 0 ? Math.round((f.completed / f.applicable) * 100) : 0} />
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={7} style={{ background: "var(--ez-light, #f8f9fb)", padding: "1rem 1.25rem" }}>
                              <FormExhibitorBreakdown formKey={f.formKey} exhibitors={data.exhibitors} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <DataTable
        columns={columns}
        rows={data?.exhibitors || []}
        keyField={(e) => e.profileId}
        loading={loading}
        searchPlaceholder="Search companies…"
        emptyMessage="No exhibitors for this event yet."
        actions={(e) => (
          <Link href={`/exhibitor-zone/admin/exhibitor-progress/${e.profileId}?company=${encodeURIComponent(e.companyName)}`} className="btn btn-ghost btn-sm">
            View Forms
          </Link>
        )}
      />
    </>
  );
}
