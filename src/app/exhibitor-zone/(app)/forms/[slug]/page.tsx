"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type FieldError } from "../../../_lib/apiClient";

interface FieldSpec {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox" | "textarea" | "file";
  required: boolean;
  options?: string[];
}

interface Template {
  name: string;
  description: string | null;
  schema: FieldSpec[];
}

export default function FormRenderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api
      .get<{ template: Template }>(`/forms/templates/${slug}`)
      .then((body) => setTemplate(body.template))
      .catch((err) => setApiError(err instanceof ApiError ? err.message : "Failed to load form."));
  }, [slug]);

  function setField(name: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setErrors({});
    setSubmitting(true);

    try {
      await api.post(`/forms/submissions/${slug}`, values);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(err.message);
        if (err.fieldErrors) {
          const next: Record<string, string> = {};
          err.fieldErrors.forEach((fe: FieldError) => {
            next[fe.field] = fe.message;
          });
          setErrors(next);
        }
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="card text-center" style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
        <div className="card-body" style={{ padding: "2.5rem 1.5rem" }}>
          <i className="bx bx-check-circle" style={{ fontSize: "3rem", color: "var(--ez-success)" }} />
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Form submitted</h3>
          <p className="text-muted text-small mb-4">You&apos;ll be notified once it&apos;s reviewed.</p>
          <button type="button" className="btn btn-primary w-100" onClick={() => router.push("/exhibitor-zone/forms")}>
            Back to Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{template?.name || "Loading…"}</h1>
        {template?.description && <p className="content-subtitle">{template.description}</p>}
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      {template && (
        <div className="card">
          <div className="card-body">
            <form noValidate onSubmit={handleSubmit}>
              <div className="grid grid-2">
                {template.schema
                  .filter((f) => f.type !== "file")
                  .map((field) => (
                    <div className="form-group" style={field.type === "textarea" ? { gridColumn: "1 / -1" } : undefined} key={field.name}>
                      <label className="form-label">
                        {field.label} {field.required && <span style={{ color: "var(--ez-danger)" }}>*</span>}
                      </label>

                      {field.type === "select" ? (
                        <select className="form-control form-select" value={(values[field.name] as string) || ""} onChange={(e) => setField(field.name, e.target.value)} required={field.required}>
                          <option value="">Select…</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea className="form-control" rows={3} value={(values[field.name] as string) || ""} onChange={(e) => setField(field.name, e.target.value)} />
                      ) : field.type === "checkbox" ? (
                        <div className="d-flex align-center gap-1" style={{ marginTop: "0.5rem" }}>
                          <input type="checkbox" checked={Boolean(values[field.name])} onChange={(e) => setField(field.name, e.target.checked)} style={{ width: 18, height: 18 }} />
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          className="form-control"
                          value={(values[field.name] as string) || ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          required={field.required}
                        />
                      )}
                      {errors[field.name] && (
                        <span className="text-xs" style={{ color: "var(--ez-danger)", display: "block", marginTop: "0.25rem" }}>
                          {errors[field.name]}
                        </span>
                      )}
                    </div>
                  ))}
              </div>

              {template.schema.some((f) => f.type === "file") && (
                <div className="alert alert-info mb-3">
                  <i className="bx bx-info-circle" />
                  <span>
                    This form has a document requirement — attach it from the{" "}
                    <a href="/exhibitor-zone/documents" style={{ color: "inherit", fontWeight: 600 }}>
                      Documents page
                    </a>{" "}
                    after submitting.
                  </span>
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
