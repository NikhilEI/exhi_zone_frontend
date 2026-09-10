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
}

const ROLES = ["super_admin", "organiser", "finance"];

export default function AdminUsersPage() {
  const { user: currentUser } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", role: "organiser" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";

  function load() {
    api
      .get<{ users: AdminUser[] }>("/admin/users")
      .then((body) => setUsers(body.users))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load users."));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    try {
      await api.post("/admin/users", form);
      setMessage("User created.");
      setForm({ email: "", password: "", firstName: "", lastName: "", role: "organiser" });
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

  if (!isSuperAdmin) {
    return <div className="alert alert-warning">Only super admins can manage admin users.</div>;
  }

  const columns: DataTableColumn<AdminUser>[] = [
    { key: "name", label: "Name", value: (u) => `${u.first_name} ${u.last_name}`, render: (u) => `${u.first_name} ${u.last_name}` },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (u) => <span style={{ textTransform: "capitalize" }}>{u.role.replace(/_/g, " ")}</span> },
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
                <select className="form-control form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      </div>

      <DataTable
        title="All Admin Users"
        columns={columns}
        rows={users}
        keyField={(u) => u.id}
        searchPlaceholder="Search admin users…"
        emptyMessage="No admin users found."
        actions={(u) =>
          u.id !== currentUser?.id ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleStatus(u)}>
              {u.is_active ? "Disable" : "Enable"}
            </button>
          ) : null
        }
      />
    </>
  );
}
