"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatCurrency } from "../../../_lib/format";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Item {
  id: number;
  category_name: string;
  sku: string;
  name: string;
  price_inr: string;
  price_usd: string | null;
  is_active: number;
}

export default function AdminCataloguePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [newItem, setNewItem] = useState({ categoryId: "", sku: "", name: "", priceInr: "", priceUsd: "", unit: "each" });

  function load() {
    api.get<{ categories: Category[] }>("/catalogue/categories").then((b) => setCategories(b.categories)).catch(() => {});
    api.get<{ items: Item[] }>("/catalogue/items").then((b) => setItems(b.items)).catch(() => {});
  }

  useEffect(load, []);

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/catalogue/categories", newCategory);
      setNewCategory({ name: "", slug: "" });
      setMessage("Category created.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create category.");
    }
  }

  async function handleCreateItem(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!newItem.categoryId) {
      setError("Please select a category.");
      return;
    }
    try {
      await api.post("/catalogue/items", { ...newItem, categoryId: Number(newItem.categoryId) });
      setNewItem({ categoryId: "", sku: "", name: "", priceInr: "", priceUsd: "", unit: "each" });
      setMessage("Item created.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create item.");
    }
  }

  async function toggleActive(item: Item) {
    try {
      await api.patch(`/catalogue/items/${item.id}`, { isActive: !item.is_active });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update item.");
    }
  }

  const itemColumns: DataTableColumn<Item>[] = [
    { key: "category_name", label: "Category" },
    { key: "sku", label: "SKU" },
    { key: "name", label: "Name" },
    {
      key: "price_inr",
      label: "Price",
      value: (i) => Number(i.price_inr),
      render: (i) => (
        <>
          <div>{formatCurrency(i.price_inr)}</div>
          {i.price_usd && <div className="text-xs text-muted">{formatCurrency(i.price_usd, "USD")}</div>}
        </>
      )
    },
    {
      key: "is_active",
      label: "Active",
      render: (i) => (i.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-secondary">Inactive</span>)
    }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Catalogue</h1>
        <p className="content-subtitle">Manage service categories and orderable items for exhibitors</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="grid mb-3" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Add Category</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-control" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input className="form-control" value={newCategory.slug} onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })} placeholder="my-category" required />
              </div>
              <button type="submit" className="btn btn-primary">
                Add Category
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Add Item</span>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateItem}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-control form-select" value={newItem.categoryId} onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })} required>
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input className="form-control" value={newItem.sku} onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-control" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (INR)</label>
                  <input type="number" className="form-control" value={newItem.priceInr} onChange={(e) => setNewItem({ ...newItem, priceInr: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (USD)</label>
                  <input type="number" className="form-control" value={newItem.priceUsd} onChange={(e) => setNewItem({ ...newItem, priceUsd: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input className="form-control" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">
                Add Item
              </button>
            </form>
          </div>
        </div>
      </div>

      <DataTable
        columns={itemColumns}
        rows={items}
        keyField={(item) => item.id}
        searchPlaceholder="Search items…"
        emptyMessage="No catalogue items yet."
        actions={(item) => (
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => toggleActive(item)}>
            {item.is_active ? "Deactivate" : "Activate"}
          </button>
        )}
      />
    </>
  );
}
