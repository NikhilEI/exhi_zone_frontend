"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../_lib/apiClient";
import { formatCurrency } from "../../_lib/format";

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
  items: CartItem[];
  subtotal: number;
  surchargeTotal: number;
  taxTotal: number;
  grandTotal: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    api
      .get<CartResponse>("/cart")
      .then(setCart)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load cart."))
      .finally(() => setLoading(false));
  }

  // load() is reused for both mount and post-action refetches, so its
  // setLoading(true) call is intentional even though it's redundant on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  async function handleRemove(itemId: number) {
    try {
      await api.delete(`/cart/items/${itemId}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove item.");
    }
  }

  async function handleCheckout() {
    setCheckingOut(true);
    setError("");
    try {
      const result = await api.post<{ orderId: number }>("/cart/checkout");
      router.push(`/exhibitor-zone/orders/${result.orderId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed.");
      setCheckingOut(false);
    }
  }

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Shopping Cart</h1>
        <p className="content-subtitle">Review items and complete checkout for your ordered services</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem 0" }}>
          <div className="spinner" />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <div className="card" style={{ padding: "3.5rem 2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3.5rem", color: "var(--ez-muted)", marginBottom: "1rem" }}>
            <i className="bx bx-cart" />
          </div>
          <h3 style={{ color: "var(--ez-dark)", marginBottom: "0.5rem" }}>Your cart is empty</h3>
          <p className="text-muted text-small mb-0">Browse the catalogue to add items.</p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Surcharge</th>
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
                      <td className="text-small">{Number(item.surcharge_pct) > 0 ? `${item.surcharge_pct}%` : "—"}</td>
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
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">Order Summary</span>
            </div>
            <div className="card-body">
              <div className="d-flex justify-between mb-1">
                <span className="text-small text-muted">Subtotal</span>
                <span className="text-small">{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="d-flex justify-between mb-1">
                <span className="text-small text-muted">Surcharge</span>
                <span className="text-small">{formatCurrency(cart.surchargeTotal)}</span>
              </div>
              <div className="d-flex justify-between mb-3">
                <span className="text-small text-muted">Tax</span>
                <span className="text-small">{formatCurrency(cart.taxTotal)}</span>
              </div>
              <div className="d-flex justify-between mb-3" style={{ borderTop: "1px solid var(--ez-divider)", paddingTop: "0.75rem" }}>
                <span className="fw-700" style={{ color: "var(--ez-dark)" }}>
                  Total
                </span>
                <span className="fw-700" style={{ color: "var(--ez-primary)" }}>
                  {formatCurrency(cart.grandTotal)}
                </span>
              </div>
              <button type="button" className="btn btn-primary w-100" onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? "Placing order..." : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
