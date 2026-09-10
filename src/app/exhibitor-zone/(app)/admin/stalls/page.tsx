"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import StatusBadge from "../../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Stall {
  id: number;
  stall_number: string;
  hall: string | null;
  area_sqm: string | null;
  status: string;
  allocation_id: number | null;
  allocated_to: string | null;
}

interface Profile {
  id: number;
  display_name: string;
}

export default function AdminStallsPage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newStall, setNewStall] = useState({ stallNumber: "", hall: "", areaSqm: "" });
  const [allocateFor, setAllocateFor] = useState<number | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<number | "">("");
  const [error, setError] = useState("");

  function load() {
    api
      .get<{ stalls: Stall[] }>("/stalls")
      .then((body) => setStalls(body.stalls))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load stalls."));
    api
      .get<{ profiles: Profile[] }>("/exhibitors?status=approved")
      .then((body) => setProfiles(body.profiles))
      .catch(() => {});
  }

  useEffect(load, []);

  async function handleCreateStall(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/stalls", { ...newStall, areaSqm: newStall.areaSqm || undefined });
      setNewStall({ stallNumber: "", hall: "", areaSqm: "" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create stall.");
    }
  }

  async function handleAllocate(stallId: number) {
    if (!selectedProfile) return;
    setError("");
    try {
      await api.post("/stalls/allocations", { stallId, exhibitorProfileId: selectedProfile });
      setAllocateFor(null);
      setSelectedProfile("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to allocate stall.");
    }
  }

  async function handleRelease(allocationId: number) {
    if (!confirm("Release this stall allocation?")) return;
    try {
      await api.delete(`/stalls/allocations/${allocationId}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to release allocation.");
    }
  }

  const stallColumns: DataTableColumn<Stall>[] = [
    { key: "stall_number", label: "Stall" },
    { key: "hall", label: "Hall", render: (s) => s.hall || "—" },
    { key: "area_sqm", label: "Area", value: (s) => Number(s.area_sqm) || 0, render: (s) => (s.area_sqm ? `${s.area_sqm} sqm` : "—") },
    { key: "status", label: "Status", render: (s) => <StatusBadge status={s.status} /> },
    { key: "allocated_to", label: "Allocated To", render: (s) => s.allocated_to || "—" }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Stalls</h1>
        <p className="content-subtitle">Add stalls to the floor plan and allocate them to approved exhibitors</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Add Stall</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreateStall}>
            <div className="grid grid-4" style={{ alignItems: "end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stall Number</label>
                <input className="form-control" value={newStall.stallNumber} onChange={(e) => setNewStall({ ...newStall, stallNumber: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Hall</label>
                <input className="form-control" value={newStall.hall} onChange={(e) => setNewStall({ ...newStall, hall: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Area (sqm)</label>
                <input type="number" className="form-control" value={newStall.areaSqm} onChange={(e) => setNewStall({ ...newStall, areaSqm: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <button type="submit" className="btn btn-primary w-100">
                  Add Stall
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DataTable
        title="All Stalls"
        columns={stallColumns}
        rows={stalls}
        keyField={(s) => s.id}
        searchPlaceholder="Search stalls…"
        emptyMessage="No stalls configured yet."
        actions={(s) => (
          <>
            {s.status === "available" &&
              (allocateFor === s.id ? (
                <div className="d-flex gap-1 align-center">
                  <select className="form-control form-select" style={{ minWidth: 160 }} value={selectedProfile} onChange={(e) => setSelectedProfile(Number(e.target.value))}>
                    <option value="">Select exhibitor…</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAllocate(s.id)}>
                    Assign
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setAllocateFor(s.id)}>
                  Allocate
                </button>
              ))}
            {s.status === "booked" && s.allocation_id && (
              <button type="button" className="btn btn-sm btn-ghost" style={{ color: "var(--ez-danger)" }} onClick={() => handleRelease(s.allocation_id!)}>
                Release
              </button>
            )}
          </>
        )}
      />
    </>
  );
}
