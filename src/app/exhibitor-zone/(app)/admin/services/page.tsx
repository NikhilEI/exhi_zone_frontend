"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface FormTemplate {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  form_type: string;
  sort_order: number;
  is_active: number;
}

export default function AdminServicesPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    api
      .get<{ templates: FormTemplate[] }>("/forms/admin/templates")
      .then((body) => setTemplates(body.templates))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load forms."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  async function toggle(t: FormTemplate) {
    setError("");
    setMessage("");
    try {
      await api.patch(`/forms/admin/templates/${t.id}`, { isActive: !t.is_active });
      setMessage(`"${t.name}" is now ${t.is_active ? "disabled" : "enabled"}.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update form.");
    }
  }

  const columns: DataTableColumn<FormTemplate>[] = [
    { key: "sort_order", label: "#" },
    { key: "name", label: "Form" },
    { key: "slug", label: "Slug", render: (t) => <code className="text-xs">{t.slug}</code> },
    {
      key: "form_type",
      label: "Type",
      render: (t) => <span className={`badge ${t.form_type === "mandatory" ? "badge-warning" : "badge-info"}`}>{t.form_type === "mandatory" ? "Mandatory" : "Additional"}</span>
    },
    {
      key: "is_active",
      label: "Status",
      render: (t) => <span className={`badge ${t.is_active ? "badge-success" : "badge-secondary"}`}>{t.is_active ? "Active" : "Disabled"}</span>
    }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Additional Requirements &amp; Forms</h1>
        <p className="content-subtitle">Turn service request forms (Translators, Security Personnel, etc.) and other form templates on or off for exhibitors</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={templates}
        keyField={(t) => t.id}
        loading={loading}
        searchPlaceholder="Search forms…"
        emptyMessage="No form templates are registered yet."
        actions={(t) => (
          <button type="button" className={`btn btn-sm ${t.is_active ? "btn-ghost" : "btn-outline-primary"}`} onClick={() => toggle(t)}>
            {t.is_active ? "Disable" : "Enable"}
          </button>
        )}
      />
    </>
  );
}
