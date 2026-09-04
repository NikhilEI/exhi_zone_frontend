"use client";

import { use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../_lib/apiClient";
import { formatCurrency } from "../../../../_lib/format";

interface CartItem {
  id: number;
  service_item_id: number;
  quantity: number;
  unit_price: string;
  surcharge_pct: string;
  name: string;
  sku: string;
  unit: string;
}

interface CartResponse {
  cart: { exhibitor_profile_id: number } | null;
  items: CartItem[];
  subtotal: number;
  surchargeTotal: number;
  taxTotal: number;
  grandTotal: number;
}

interface CatalogueItem {
  id: number;
  name: string;
  sku: string;
  category_name: string;
}

export default function AdminCartDetailPage({ params }: { params: Promise<{ profileId: string }> }) {
  const { profileId } = use(params);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.get<CartResponse>(`/cart/${profileId}`),
      api.get<{ items: CatalogueItem[] }>("/catalogue/items"),
      api.get<{ profile: { display_name: string } }>(`/exhibitors/${profileId}`)
    ])
      .then(([cartBody, catalogueBody, profileBody]) => {
        setCart(cartBody);
        setCatalogue(catalogueBody.items);
        setCompanyName(profileBody.profile.display_name);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load cart."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, [profileId]);

  async function handleRemove(itemId: number) {
    setError("");
    setMessage("");
    try {
      await api.delete(`/cart/${profileId}/items/${itemId}`);
      setMessage("Item removed.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove item.");
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!selectedItemId) {
      setError("Please select a catalogue item to add.");
      return;
    }
    setAdding(true);
    try {
      await api.post(`/cart/${profileId}/items`, { serviceItemId: Number(selectedItemId), quantity });
      setMessage("Item added to the exhibitor's cart.");
      setSelectedItemId("");
      setQuantity(1);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add item.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">{companyName || "…"}'s Cart</h1>
        <p className="content-subtitle">View and manage this exhibitor's active cart on their behalf</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="grid grid-2" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Cart Items</span>
            </div>
            {!cart || cart.items.length === 0 ? (
              <div className="card-body">
                <p className="text-muted text-small mb-0">This exhibitor's cart is empty.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                            {item.name}
                          </div>
                          <div className="text-xs text-muted">{item.sku}</div>
                        </td>
                        <td className="text-small">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="text-small">{formatCurrency(item.unit_price)}</td>
                        <td>
                          <button type="button" className="btn btn-ghost btn-icon btn-sm" style={{ color: "var(--ez-danger)" }} onClick={() => handleRemove(item.id)}>
                            <i className="bx bx-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="card-body" style={{ borderTop: "1px solid var(--ez-divider)" }}>
              <p className="text-xs fw-600" style={{ textTransform: "uppercase", color: "var(--ez-muted)", letterSpacing: "0.04em", marginBottom: "0.75rem" }}>
                Add Item
              </p>
              <form onSubmit={handleAdd} className="d-flex gap-2" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
                <div className="form-group mb-0" style={{ flex: 1, minWidth: 220 }}>
                  <label className="form-label">Catalogue Item</label>
                  <select className="form-control form-select" value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
                    <option value="">Select an item</option>
                    {catalogue.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.category_name} — {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group mb-0" style={{ width: 100 }}>
                  <label className="form-label">Qty</label>
                  <input type="number" min={1} className="form-control" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={adding}>
                  {adding ? "Adding..." : "Add"}
                </button>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Order Summary</span>
            </div>
            <div className="card-body">
              <div className="d-flex justify-between mb-1">
                <span className="text-small text-muted">Subtotal</span>
                <span className="text-small">{formatCurrency(cart?.subtotal || 0)}</span>
              </div>
              <div className="d-flex justify-between mb-1">
                <span className="text-small text-muted">Surcharge</span>
                <span className="text-small">{formatCurrency(cart?.surchargeTotal || 0)}</span>
              </div>
              <div className="d-flex justify-between mb-3">
                <span className="text-small text-muted">Tax</span>
                <span className="text-small">{formatCurrency(cart?.taxTotal || 0)}</span>
              </div>
              <div className="d-flex justify-between" style={{ borderTop: "1px solid var(--ez-divider)", paddingTop: "0.75rem" }}>
                <span className="fw-700" style={{ color: "var(--ez-dark)" }}>
                  Total
                </span>
                <span className="fw-700" style={{ color: "var(--ez-primary)" }}>
                  {formatCurrency(cart?.grandTotal || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/exhibitor-zone/admin/carts" className="btn btn-outline-primary">
          <i className="bx bx-chevron-left" /> Back to Carts
        </Link>
      </div>
    </>
  );
}
