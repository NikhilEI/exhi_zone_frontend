"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "../_lib/apiClient";

export default function ServiceGate({ slug, children }: { slug: string; children: ReactNode }) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .get(`/forms/templates/${slug}`)
      .then(() => setAvailable(true))
      .catch((err) => setAvailable(!(err instanceof ApiError && err.status === 404)));
  }, [slug]);

  if (available === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="card text-center" style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
        <div className="card-body" style={{ padding: "2.5rem 1.5rem" }}>
          <i className="bx bx-block" style={{ fontSize: "3rem", color: "var(--ez-muted)" }} />
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Service not available</h3>
          <p className="text-muted text-small mb-0">This service is not currently available. Please check back later.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
