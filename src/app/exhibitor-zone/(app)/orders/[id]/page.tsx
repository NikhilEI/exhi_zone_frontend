"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatCurrency, formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";

interface OrderItem {
  id: number;
  name_snapshot: string;
  sku_snapshot: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

interface OrderDetail {
  order: {
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: string;
    surcharge_total: string;
    tax_total: string;
    grand_total: string;
    created_at: string;
  };
  items: OrderItem[];
  invoice: { invoice_number: string; amount_paid: string; amount_due: string; invoice_status: string } | null;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<OrderDetail>(`/orders/${id}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load order."));
  }, [id]);

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Order {data?.order.order_number || "…"}</h1>
        <p className="content-subtitle">Order items, payment status, and invoice details</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {data && (
        <div className="grid grid-2 mb-3" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Items</span>
              <div className="d-flex gap-1">
                <StatusBadge status={data.order.status} />
                <StatusBadge status={data.order.payment_status} />
              </div>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                          {item.name_snapshot}
                        </div>
                        <div className="text-xs text-muted">{item.sku_snapshot}</div>
                      </td>
                      <td className="text-small">{item.quantity}</td>
                      <td className="text-small">{formatCurrency(item.unit_price)}</td>
                      <td className="text-small">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Summary</span>
              </div>
              <div className="card-body">
                <div className="d-flex justify-between mb-1">
                  <span className="text-small text-muted">Subtotal</span>
                  <span className="text-small">{formatCurrency(data.order.subtotal)}</span>
                </div>
                <div className="d-flex justify-between mb-1">
                  <span className="text-small text-muted">Surcharge</span>
                  <span className="text-small">{formatCurrency(data.order.surcharge_total)}</span>
                </div>
                <div className="d-flex justify-between mb-3">
                  <span className="text-small text-muted">Tax</span>
                  <span className="text-small">{formatCurrency(data.order.tax_total)}</span>
                </div>
                <div className="d-flex justify-between" style={{ borderTop: "1px solid var(--ez-divider)", paddingTop: "0.75rem" }}>
                  <span className="fw-700" style={{ color: "var(--ez-dark)" }}>
                    Total
                  </span>
                  <span className="fw-700" style={{ color: "var(--ez-primary)" }}>
                    {formatCurrency(data.order.grand_total)}
                  </span>
                </div>
                <p className="text-muted text-xs mt-2" style={{ margin: 0 }}>
                  Placed {formatDate(data.order.created_at)}
                </p>
              </div>
            </div>

            {data.invoice && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Invoice</span>
                </div>
                <div className="card-body">
                  <div className="d-flex justify-between mb-1">
                    <span className="text-small text-muted">Invoice #</span>
                    <span className="fw-600 text-small" style={{ color: "var(--ez-dark)" }}>
                      {data.invoice.invoice_number}
                    </span>
                  </div>
                  <div className="d-flex justify-between mb-1">
                    <span className="text-small text-muted">Status</span>
                    <StatusBadge status={data.invoice.invoice_status} />
                  </div>
                  <div className="d-flex justify-between mb-1">
                    <span className="text-small text-muted">Paid</span>
                    <span className="text-small">{formatCurrency(data.invoice.amount_paid)}</span>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-small text-muted">Due</span>
                    <span className="text-small">{formatCurrency(data.invoice.amount_due)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Link href="/exhibitor-zone/orders" className="btn btn-ghost">
        <i className="bx bx-chevron-left" /> Back to Orders
      </Link>
    </>
  );
}
