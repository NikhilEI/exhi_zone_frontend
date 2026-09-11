"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import { useSession } from "../../../_lib/SessionProvider";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: number;
  enabled_modules: string[];
}

const ROLES = ["super_admin", "organiser", "finance", "operations", "sales"];
const RESTRICTED_ROLES = ["operations", "sales"];

function roleLabel(role: string) {
  return role.replace(/_/g, " ");
}

export default function AdminUsersPage() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", role: "organiser", enabledModules: [] as string[] });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [savingModules, setSavingModules] = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";

  function load() {
    api
      .get<{ users: AdminUser[]; availableModules: string[] }>("/admin/users")
      .then((body) => {
        setUsers(body.users);
        setAvailableModules(body.availableModules);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load users."));
  }

  useEffect(load, []);

  function toggleFormModule(key: string) {
    setForm((f) => ({
      ...f,
      enabledModules: f.enabledModules.includes(key) ? f.enabledModules.filter((m) => m !== key) : [...f.enabledModules, key]
    }));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    try {
      await api.post("/admin/users", form);
      setMessage("User created.");
      setForm({ email: "", password: "", firstName: "", lastName: "", role: "organiser", enabledModules: [] });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(u: AdminUser) {
    try {
      await api.patch(`/admin/users/${u.id}/status`, { isActive: !u.is_active });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update user.");
    }
  }

  function startEditModules(u: AdminUser) {
    setEditingUser(u);
    setEditModules(u.enabled_modules || []);
  }

  function toggleEditModule(key: string) {
    setEditModules((m) => (m.includes(key) ? m.filter((k) => k !== key) : [...m, key]));
  }

  async function saveModules() {
    if (!editingUser) return;
    setSavingModules(true);
    setError("");
    try {
      await api.patch(`/admin/users/${editingUser.id}/modules`, { enabledModules: editModules });
      setEditingUser(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update module access.");
    } finally {
      setSavingModules(false);
    }
  }

  if (!isSuperAdmin) {
    return <div className="alert alert-warning">Only super admins can manage admin users.</div>;
  }

  const columns: DataTableColumn<AdminUser>[] = [
    { key: "name", label: "Name", value: (u) => `${u.first_name} ${u.last_name}`, render: (u) => `${u.first_name} ${u.last_name}` },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (u) => <span style={{ textTransform: "capitalize" }}>{roleLabel(u.role)}</span> },
    {
      key: "modules",
      label: "Module Access",
      render: (u) =>
        RESTRICTED_ROLES.includes(u.role) ? (
          u.enabled_modules.length > 0 ? (
            <span className="text-small">
              {u.enabled_modules.length} of {availableModules.length} modules
            </span>
          ) : (
            <span className="text-small text-muted">No modules granted yet</span>
          )
        ) : (
          <span className="text-small text-muted">Full access</span>
        )
    },
    {
      key: "is_active",
      label: "Status",
      render: (u) => (u.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-secondary">Disabled</span>)
    }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Admin Users</h1>
        <p className="content-subtitle">Manage organiser-side accounts with access to this admin console</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="card mb-3">
        <div className="card-header">
          <span className="card-title">Add Admin User</span>
        </div>
        <div className="card-body">
          <form onSubmit={handleCreate}>
            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-control" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-control" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, enabledModules: [] })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
              </div>
            </div>

            {RESTRICTED_ROLES.includes(form.role) && (
              <div className="form-group">
                <label className="form-label">
                  Module Access <span className="text-muted text-small">(only checked modules will be reachable for this account)</span>
                </label>
                <div className="grid grid-3" style={{ gap: "0.5rem" }}>
                  {availableModules.map((key) => (
                    <label key={key} className="d-flex align-center gap-2 text-small" style={{ fontWeight: 400 }}>
                      <input type="checkbox" checked={form.enabledModules.includes(key)} onChange={() => toggleFormModule(key)} />
                      {key.replace(/-/g, " ")}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      </div>

      {editingUser && (
        <div className="card mb-3">
          <div className="card-header">
            <span className="card-title">
              Module Access — {editingUser.first_name} {editingUser.last_name}
            </span>
          </div>
          <div className="card-body">
            <div className="grid grid-3" style={{ gap: "0.5rem" }}>
              {availableModules.map((key) => (
                <label key={key} className="d-flex align-center gap-2 text-small" style={{ fontWeight: 400 }}>
                  <input type="checkbox" checked={editModules.includes(key)} onChange={() => toggleEditModule(key)} />
                  {key.replace(/-/g, " ")}
                </label>
              ))}
            </div>
            <div className="d-flex gap-2 mt-3">
              <button type="button" className="btn btn-primary" onClick={saveModules} disabled={savingModules}>
                {savingModules ? "Saving..." : "Save"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingUser(null)} disabled={savingModules}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        title="All Admin Users"
        columns={columns}
        rows={users}
        keyField={(u) => u.id}
        searchPlaceholder="Search admin users…"
        emptyMessage="No admin users found."
        actions={(u) =>
          u.id !== currentUser?.id ? (
            <div className="d-flex gap-2">
              {RESTRICTED_ROLES.includes(u.role) && (
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => startEditModules(u)}>
                  Edit Modules
                </button>
              )}
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleStatus(u)}>
                {u.is_active ? "Disable" : "Enable"}
              </button>
            </div>
          ) : null
        }
      />
    </>
  );
}
