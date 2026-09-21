"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { api, ApiError } from "../../../_lib/apiClient";
import { showErrorAlert, showSuccessAlert } from "../../../_lib/alerts";
import StatusBadge from "../../../_components/StatusBadge";

interface AssignmentExhibitor {
  profileId: number;
  companyName: string;
  profileStatus: string;
  salesUserId: number | null;
  salesUserName: string | null;
}

interface SalesUser {
  id: number;
  name: string;
  email: string;
  exhibitorCount: number;
}

// "all" | "unassigned" | a sales user's id as a string
type Filter = string;

export default function ExhibitorAssignmentsPage() {
  const [exhibitors, setExhibitors] = useState<AssignmentExhibitor[]>([]);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [targetSalesId, setTargetSalesId] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    return api
      .get<{ exhibitors: AssignmentExhibitor[]; salesUsers: SalesUser[] }>("/admin/exhibitor-assignments")
      .then((body) => {
        setExhibitors(body.exhibitors);
        setSalesUsers(body.salesUsers);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load exhibitors."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const unassignedCount = exhibitors.filter((e) => e.salesUserId === null).length;

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return exhibitors.filter((e) => {
      if (filter === "unassigned" && e.salesUserId !== null) return false;
      if (filter !== "all" && filter !== "unassigned" && String(e.salesUserId) !== filter) return false;
      if (needle && !`${e.companyName} ${e.salesUserName || ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [exhibitors, search, filter]);

  const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.has(e.profileId));

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((e) => next.delete(e.profileId));
      else visible.forEach((e) => next.add(e.profileId));
      return next;
    });
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function apply(salesUserId: number | null) {
    if (selected.size === 0) return;
    const chosen = exhibitors.filter((e) => selected.has(e.profileId));

    // Only interrupt when this actually takes clients away from someone.
    const moved = chosen.filter((e) => e.salesUserId !== null && e.salesUserId !== salesUserId);
    if (moved.length > 0) {
      const target = salesUserId === null ? "no one" : salesUsers.find((u) => u.id === salesUserId)?.name;
      const confirmed = await Swal.fire({
        icon: "question",
        title: salesUserId === null ? "Unassign these exhibitors?" : "Reassign these exhibitors?",
        html: `<b>${moved.length}</b> of the selected exhibitor(s) currently belong to another salesman. They will be moved to <b>${target}</b> and disappear from their current salesman's list.`,
        showCancelButton: true,
        confirmButtonText: "Yes, continue",
        cancelButtonText: "Cancel"
      });
      if (!confirmed.isConfirmed) return;
    }

    setSaving(true);
    setError("");
    try {
      const result = await api.put<{ message: string }>("/admin/exhibitor-assignments", {
        profileIds: [...selected],
        salesUserId
      });
      showSuccessAlert(result.message);
      setSelected(new Set());
      setTargetSalesId("");
      await load();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save assignments.";
      setError(message);
      showErrorAlert(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Assign Exhibitors to Sales</h1>
        <p className="content-subtitle">Tick exhibitors, pick a salesman and assign — each salesman only sees their own clients</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {salesUsers.length === 0 && (
        <div className="alert alert-warning mb-3">
          There are no active Sales accounts for this event yet. Create one under Admin Users (role: Sales), then come back here.
        </div>
      )}

      <div className="d-flex gap-2 mb-3" style={{ flexWrap: "wrap" }}>
        {[
          { key: "all", label: "All exhibitors", count: exhibitors.length },
          { key: "unassigned", label: "Unassigned", count: unassignedCount },
          ...salesUsers.map((u) => ({ key: String(u.id), label: u.name, count: u.exhibitorCount }))
        ].map((chip) => (
          <button
            key={chip.key}
            type="button"
            className={`btn btn-sm ${filter === chip.key ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setFilter(chip.key)}
          >
            {chip.label} ({chip.count})
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header d-flex justify-between align-center" style={{ gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            className="form-control"
            style={{ maxWidth: 320 }}
            placeholder="Search exhibitor or salesman…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="text-small text-muted">
            {selected.size} selected · {visible.length} shown
          </span>
        </div>

        {selected.size > 0 && (
          <div className="card-body d-flex gap-2 align-center" style={{ flexWrap: "wrap", borderBottom: "1px solid var(--ez-divider)", background: "var(--ez-bg-body)" }}>
            <select className="form-control form-select" style={{ maxWidth: 260 }} value={targetSalesId} onChange={(e) => setTargetSalesId(e.target.value)}>
              <option value="">Choose salesman…</option>
              {salesUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.exhibitorCount})
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary btn-sm" disabled={!targetSalesId || saving} onClick={() => apply(Number(targetSalesId))}>
              {saving ? "Saving…" : `Assign ${selected.size}`}
            </button>
            <button type="button" className="btn btn-outline-primary btn-sm" disabled={saving} onClick={() => apply(null)}>
              Unassign
            </button>
            <button type="button" className="btn btn-sm" disabled={saving} onClick={() => setSelected(new Set())}>
              Clear selection
            </button>
          </div>
        )}

        <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all shown exhibitors" />
                </th>
                <th>Exhibitor</th>
                <th>Status</th>
                <th>Assigned Salesman</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted" style={{ textAlign: "center", padding: "2rem" }}>
                    No exhibitors match.
                  </td>
                </tr>
              ) : (
                visible.map((e) => (
                  <tr key={e.profileId} onClick={() => toggleOne(e.profileId)} style={{ cursor: "pointer" }}>
                    <td>
                      <input type="checkbox" checked={selected.has(e.profileId)} onChange={() => toggleOne(e.profileId)} onClick={(ev) => ev.stopPropagation()} aria-label={`Select ${e.companyName}`} />
                    </td>
                    <td className="fw-600">{e.companyName}</td>
                    <td>
                      <StatusBadge status={e.profileStatus} />
                    </td>
                    <td>{e.salesUserName || <span className="text-muted">Unassigned</span>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
