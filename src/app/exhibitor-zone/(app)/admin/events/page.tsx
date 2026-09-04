"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";

interface Event {
  id: number;
  name: string;
  slug: string;
  status: string;
  start_date: string;
  end_date: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", startDate: "", endDate: "" });
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  function load() {
    api
      .get<{ events: Event[] }>("/events")
      .then((body) => setEvents(body.events))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load events."));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await api.post("/events", form);
      setShowCreate(false);
      setForm({ name: "", slug: "", startDate: "", endDate: "" });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create event.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="content-header d-flex justify-between align-center">
        <div>
          <h1 className="content-title">Events</h1>
          <p className="content-subtitle">Manage the shows running through the Exhibitor Zone</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreate((v) => !v)}>
          <i className={`bx ${showCreate ? "bx-x" : "bx-calendar-plus"}`} />
          {showCreate ? "Cancel" : "New Event"}
        </button>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {showCreate && (
        <div className="card mb-3">
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="grid" style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", alignItems: "end" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Name</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Slug</label>
                  <input className="form-control" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="my-event-2027" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <button type="submit" className="btn btn-primary w-100" disabled={creating}>
                    {creating ? "..." : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Events</span>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dates</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="fw-600" style={{ color: "var(--ez-dark)" }}>
                    {e.name}
                  </td>
                  <td className="text-small text-muted">
                    {formatDate(e.start_date)} – {formatDate(e.end_date)}
                  </td>
                  <td>
                    <StatusBadge status={e.status} />
                  </td>
                  <td>
                    <Link href={`/exhibitor-zone/admin/events/${e.id}`} className="btn btn-sm btn-ghost">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-muted text-small" style={{ textAlign: "center", padding: "2rem" }}>
                    No events created yet.
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
