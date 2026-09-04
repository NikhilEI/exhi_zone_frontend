"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDateTime } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface PassType {
  id: number;
  name: string;
}

interface Profile {
  id: number;
  display_name: string;
}

interface Pass {
  id: number;
  holder_first_name: string;
  holder_last_name: string;
  pass_type_name: string;
  status: string;
  issued_at: string;
}

export default function AdminPassesPage() {
  const [passTypes, setPassTypes] = useState<PassType[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [allocation, setAllocation] = useState({ exhibitorProfileId: "", passTypeId: "", allocatedQty: "1" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    api.get<{ passTypes: PassType[] }>("/passes/types").then((b) => setPassTypes(b.passTypes)).catch(() => {});
    api.get<{ profiles: Profile[] }>("/exhibitors?status=approved").then((b) => setProfiles(b.profiles)).catch(() => {});
    api.get<{ passes: Pass[] }>("/passes").then((b) => setPasses(b.passes)).catch(() => {});
  }

  useEffect(load, []);

  async function handleAllocate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.post("/passes/allocations", {
        exhibitorProfileId: Number(allocation.exhibitorProfileId),
        passTypeId: Number(allocation.passTypeId),
        allocatedQty: Number(allocation.allocatedQty)
      });
      setMessage("Pass quota allocated.");
      setAllocation({ exhibitorProfileId: "", passTypeId: "", allocatedQty: "1" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to allocate quota.");
    }
  }

  async function handleVoid(id: number) {
    if (!confirm("Void this pass?")) return;
    try {
      await api.patch(`/passes/${id}/void`, {});
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to void pass.");
    }
  }

  const passColumns: DataTableColumn<Pass>[] = [
    { key: "holder_name", label: "Holder", value: (p) => `${p.holder_first_name} ${p.holder_last_name}` },
    { key: "pass_type_name", label: "Pass Type" },
    { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
    { key: "issued_at", label: "Issued", render: (p) => formatDateTime(p.issued_at) }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Passes</h1>
        <p className="content-subtitle">Allocate badge quotas and manage issued exhibitor passes</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Allocate Pass Quota</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleAllocate}>
            <div className="grid grid-4" style={{ alignItems: "end" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Exhibitor</label>
                <select className="form-control form-select" value={allocation.exhibitorProfileId} onChange={(e) => setAllocation({ ...allocation, exhibitorProfileId: e.target.value })} required>
                  <option value="">Select…</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pass Type</label>
                <select className="form-control form-select" value={allocation.passTypeId} onChange={(e) => setAllocation({ ...allocation, passTypeId: e.target.value })} required>
                  <option value="">Select…</option>
                  {passTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Quantity</label>
                <input type="number" min={1} className="form-control" value={allocation.allocatedQty} onChange={(e) => setAllocation({ ...allocation, allocatedQty: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <button type="submit" className="btn btn-primary w-100">
                  Allocate
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DataTable
        columns={passColumns}
        rows={passes}
        keyField={(p) => p.id}
        searchPlaceholder="Search passes…"
        emptyMessage="No passes issued yet."
        actions={(p) =>
          p.status === "issued" ? (
            <button type="button" className="btn btn-sm btn-ghost" style={{ color: "var(--ez-danger)" }} onClick={() => handleVoid(p.id)}>
              Void
            </button>
          ) : null
        }
      />
    </>
  );
}
