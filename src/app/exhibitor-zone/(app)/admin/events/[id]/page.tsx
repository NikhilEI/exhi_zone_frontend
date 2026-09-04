"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../_lib/apiClient";

interface Event {
  id: number;
  name: string;
  slug: string;
  venue_name: string | null;
  venue_city: string | null;
  status: string;
  start_date: string;
  end_date: string;
}

export default function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ event: Event }>(`/events/${id}`)
      .then((body) => setEvent(body.event))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load event."));
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!event) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.patch(`/events/${id}`, {
        name: event.name,
        venueName: event.venue_name || undefined,
        venueCity: event.venue_city || undefined,
        status: event.status
      });
      setMessage("Event updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{event?.name || "…"}</h1>
        <p className="content-subtitle">Edit event details, venue, and publication status</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {event && (
        <div className="card mb-3">
          <div className="card-body">
            <form noValidate onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={event.name} onChange={(e) => setEvent({ ...event, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control form-select" value={event.status} onChange={(e) => setEvent({ ...event, status: e.target.value })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Venue Name</label>
                  <input className="form-control" value={event.venue_name || ""} onChange={(e) => setEvent({ ...event, venue_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Venue City</label>
                  <input className="form-control" value={event.venue_city || ""} onChange={(e) => setEvent({ ...event, venue_city: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      <Link href="/exhibitor-zone/admin/events" className="btn btn-outline-primary">
        <i className="bx bx-chevron-left" /> Back to Events
      </Link>
    </>
  );
}
