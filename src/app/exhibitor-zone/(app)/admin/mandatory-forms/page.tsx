"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface FormDefinition {
  id: number;
  form_key: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: number;
}

export default function AdminMandatoryFormsPage() {
  const [definitions, setDefinitions] = useState<FormDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    api
      .get<{ definitions: FormDefinition[] }>("/mandatory-forms/admin/definitions")
      .then((body) => setDefinitions(body.definitions))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load mandatory forms."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  async function toggle(def: FormDefinition) {
    setError("");
    setMessage("");
    try {
      await api.patch(`/mandatory-forms/admin/definitions/${def.id}`, { isActive: !def.is_active });
      setMessage(`"${def.name}" is now ${def.is_active ? "disabled" : "enabled"}.`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update form.");
    }
  }

  const columns: DataTableColumn<FormDefinition>[] = [
    { key: "sort_order", label: "#" },
    { key: "name", label: "Form" },
    { key: "form_key", label: "Key", render: (d) => <code className="text-xs">{d.form_key}</code> },
    {
      key: "is_active",
      label: "Status",
      render: (d) => <span className={`badge ${d.is_active ? "badge-success" : "badge-secondary"}`}>{d.is_active ? "Active" : "Disabled"}</span>
    }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Mandatory Forms</h1>
        <p className="content-subtitle">Turn onboarding forms on or off for exhibitors — disabled forms are skipped in the exhibitor workflow</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={definitions}
        keyField={(d) => d.id}
        loading={loading}
        searchPlaceholder="Search forms…"
        emptyMessage="No mandatory forms are registered yet."
        actions={(d) => (
          <button type="button" className={`btn btn-sm ${d.is_active ? "btn-ghost" : "btn-outline-primary"}`} onClick={() => toggle(d)}>
            {d.is_active ? "Disable" : "Enable"}
          </button>
        )}
      />
    </>
  );
}
