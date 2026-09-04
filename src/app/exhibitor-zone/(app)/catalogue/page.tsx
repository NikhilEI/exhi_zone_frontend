"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../_lib/apiClient";
import { formatCurrency } from "../../_lib/format";

interface CatalogueItem {
  id: number;
  category_name: string;
  name: string;
  description: string | null;
  unit: string;
  price_inr: string;
  price_usd: string | null;
  tax_rate_pct: string;
  min_order_qty: number;
  max_order_qty: number | null;
  inventory_available: string | null;
  inventory_total: number | null;
}

export default function CataloguePage() {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ items: CatalogueItem[] }>("/catalogue/items")
      .then((body) => {
        setItems(body.items);
        const initial: Record<number, number> = {};
        body.items.forEach((item) => {
          initial[item.id] = item.min_order_qty;
        });
        setQuantities(initial);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load catalogue."))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddToCart(item: CatalogueItem) {
    setMessage("");
    setError("");
    try {
      await api.post("/cart/items", { serviceItemId: item.id, quantity: quantities[item.id] || item.min_order_qty });
      setMessage(`Added "${item.name}" to cart.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add to cart.");
    }
  }

  const grouped = items.reduce<Record<string, CatalogueItem[]>>((acc, item) => {
    (acc[item.category_name] ||= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Service Catalogue</h1>
        <p className="content-subtitle">Browse and order additional fittings, utilities, and services for your booth</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
          <div className="spinner" />
        </div>
      ) : (
        Object.entries(grouped).map(([category, categoryItems]) => (
          <div className="card mb-3" key={category}>
            <div className="card-header">
              <span className="card-title">{category}</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit Price</th>
                    <th>Tax</th>
                    <th>Qty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {categoryItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                          {item.name}
                        </div>
                        {item.description && <div className="text-xs text-muted">{item.description}</div>}
                      </td>
                      <td className="text-small">
                        <div>
                          {formatCurrency(item.price_inr)} / {item.unit}
                        </div>
                        {item.price_usd && (
                          <div className="text-xs text-muted">{formatCurrency(item.price_usd, "USD")}</div>
                        )}
                      </td>
                      <td className="text-small">{item.tax_rate_pct}%</td>
                      <td style={{ width: 100 }}>
                        <input
                          type="number"
                          className="form-control"
                          min={item.min_order_qty}
                          max={item.max_order_qty || undefined}
                          value={quantities[item.id] ?? item.min_order_qty}
                          onChange={(e) => setQuantities({ ...quantities, [item.id]: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm btn-primary" onClick={() => handleAddToCart(item)}>
                          <i className="bx bx-cart-add" /> Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </>
  );
}
