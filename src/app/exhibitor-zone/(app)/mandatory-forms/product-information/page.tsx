"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../_lib/apiClient";

interface Category {
  id: number;
  name: string;
  sort_order: number;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
}

export default function ProductInformationPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [otherText, setOtherText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const othersSubcategory = useMemo(() => subcategories.find((s) => s.name === "Others"), [subcategories]);

  useEffect(() => {
    Promise.all([
      api.get<{ categories: Category[]; subcategories: Subcategory[] }>("/mandatory-forms/product-categories"),
      api.get<{ selections: { subcategory_id: number; other_specification: string | null }[] }>("/mandatory-forms/product-information")
    ])
      .then(([ref, existing]) => {
        setCategories(ref.categories);
        setSubcategories(ref.subcategories);
        setSelected(new Set(existing.selections.map((s) => s.subcategory_id)));
        const otherSelection = existing.selections.find((s) => s.other_specification);
        if (otherSelection) setOtherText(otherSelection.other_specification || "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load product categories."))
      .finally(() => setLoading(false));
  }, []);

  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<number, Subcategory[]>();
    subcategories.forEach((s) => {
      const list = map.get(s.category_id) || [];
      list.push(s);
      map.set(s.category_id, list);
    });
    return map;
  }, [subcategories]);

  const selectedItems = useMemo(
    () =>
      Array.from(selected)
        .map((id) => subcategories.find((s) => s.id === id))
        .filter((s): s is Subcategory => Boolean(s)),
    [selected, subcategories]
  );

  function toggleCategory(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSubcategory(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setError("");
  }

  const isOthersSelected = othersSubcategory ? selected.has(othersSubcategory.id) : false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError("");
    setError("");

    if (selected.size === 0) {
      setError("Please select at least one relevant product category.");
      return;
    }
    if (isOthersSelected && !otherText.trim()) {
      setError("Please specify your category since 'Others' was selected.");
      return;
    }

    setSubmitting(true);
    try {
      await api.patch("/mandatory-forms/product-information", {
        subcategoryIds: Array.from(selected),
        otherSpecification: isOthersSelected ? otherText.trim() : undefined
      });
      setDone(true);
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="card text-center" style={{ maxWidth: 480, margin: "3rem auto", padding: "1rem" }}>
        <div className="card-body" style={{ padding: "2.5rem 1.5rem" }}>
          <i className="bx bx-check-circle" style={{ fontSize: "3rem", color: "var(--ez-success)" }} />
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem", color: "var(--ez-dark)" }}>Product Information saved</h3>
          <p className="text-muted text-small mb-4">This form is now marked as completed.</p>
          <button type="button" className="btn btn-primary w-100" onClick={() => router.push("/exhibitor-zone/mandatory-forms")}>
            Back to Mandatory Forms
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Product Information</h1>
        <p className="content-subtitle">Please note: Last date of submission is 7th March 2027, post which no forms will be entertained.</p>
      </div>

      <div className="alert alert-info mb-3">
        <i className="bx bx-info-circle" />
        <span className="text-small">Important: Product details submitted here may appear on the official website, directory, and exhibitor listings.</span>
      </div>

      {apiError && <div className="alert alert-danger mb-3">{apiError}</div>}

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start", gap: "1.5rem" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Product Details</span>
          </div>
          <div className="card-body">
            <p className="text-small text-muted mb-3">Please click on the relevant categories you wish to be listed under:</p>

            {error && <div className="alert alert-danger mb-3">{error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {categories
                .filter((c) => c.name !== "Others")
                .map((category) => {
                  const subs = subcategoriesByCategory.get(category.id) || [];
                  const isExpanded = expanded.has(category.id);
                  const selectedCount = subs.filter((s) => selected.has(s.id)).length;
                  return (
                    <div key={category.id} style={{ border: "1px solid var(--ez-border)", borderRadius: "var(--ez-border-radius-lg)", overflow: "hidden" }}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="d-flex justify-between align-center"
                        style={{ width: "100%", padding: "0.875rem 1.125rem", background: "var(--ez-bg-body)", border: "none", cursor: "pointer" }}
                      >
                        <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                          {category.name}
                          {selectedCount > 0 && (
                            <span className="badge badge-primary" style={{ marginLeft: "0.5rem" }}>
                              {selectedCount}
                            </span>
                          )}
                        </span>
                        <i className={`bx ${isExpanded ? "bx-chevron-up" : "bx-chevron-down"}`} />
                      </button>
                      {isExpanded && (
                        <div style={{ padding: "1rem 1.125rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.625rem" }}>
                          {subs.map((sub) => (
                            <label
                              key={sub.id}
                              className="d-flex align-center gap-1"
                              style={{
                                padding: "0.5rem 0.75rem",
                                border: "1px solid var(--ez-border)",
                                borderRadius: "var(--ez-border-radius)",
                                background: selected.has(sub.id) ? "var(--ez-primary-light)" : "transparent",
                                borderColor: selected.has(sub.id) ? "var(--ez-primary)" : "var(--ez-border)",
                                cursor: "pointer"
                              }}
                            >
                              <input type="checkbox" checked={selected.has(sub.id)} onChange={() => toggleSubcategory(sub.id)} style={{ flexShrink: 0 }} />
                              <span className="text-xs">{sub.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

              {othersSubcategory && (
                <div style={{ border: "1px solid var(--ez-border)", borderRadius: "var(--ez-border-radius-lg)", padding: "1rem 1.125rem" }}>
                  <label className="d-flex align-center gap-1" style={{ cursor: "pointer" }}>
                    <input type="checkbox" checked={isOthersSelected} onChange={() => toggleSubcategory(othersSubcategory.id)} />
                    <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                      Others
                    </span>
                  </label>
                  {isOthersSelected && (
                    <div className="form-group" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
                      <label className="form-label">
                        If others, please specify <span style={{ color: "var(--ez-danger)" }}>*</span>
                      </label>
                      <textarea className="form-control" rows={2} value={otherText} onChange={(e) => setOtherText(e.target.value)} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <button type="submit" className="btn btn-primary" style={{ marginTop: "1.5rem" }} disabled={submitting}>
                {submitting ? "Saving..." : "Submit"}
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Selected ({selectedItems.length})</span>
          </div>
          <div className="card-body">
            {selectedItems.length === 0 ? (
              <p className="text-muted text-small mb-0">No categories selected yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {selectedItems.map((item) => (
                  <div key={item.id} className="d-flex justify-between align-center" style={{ padding: "0.5rem 0.75rem", background: "var(--ez-bg-body)", borderRadius: "var(--ez-border-radius)" }}>
                    <span className="text-xs">{item.name}</span>
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--ez-danger)" }} onClick={() => toggleSubcategory(item.id)}>
                      <i className="bx bx-x" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
