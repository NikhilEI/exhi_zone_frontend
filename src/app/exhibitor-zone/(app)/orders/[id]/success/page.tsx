"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../../_lib/apiClient";
import { formatCurrency, formatDateTime } from "../../../../_lib/format";

interface OrderSummary {
  order: {
    order_number: string;
    payment_status: string;
    grand_total: string;
    updated_at: string;
  };
  invoice: { invoice_number: string; amount_paid: string } | null;
}

// Reached right after a successful Razorpay payment (from both the cart
// checkout flow and the order detail page's "Pay Now" retry) — a dedicated
// confirmation screen instead of just bouncing straight to the order detail
// page, so the exhibitor gets a clear "this went through" moment.
export default function PaymentSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<OrderSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<OrderSummary>(`/orders/${id}`)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load order."));
  }, [id]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "2rem 1rem" }}>
      <div className="card text-center" style={{ maxWidth: 520, width: "100%" }}>
        <div className="card-body" style={{ padding: "3rem 2rem" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--ez-success-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem"
            }}
          >
            <i className="bx bx-check" style={{ fontSize: "2.75rem", color: "var(--ez-success)" }} />
          </div>

          <h2 style={{ color: "var(--ez-dark)", marginBottom: "0.5rem" }}>Payment Successful!</h2>

          {error && <div className="alert alert-danger mt-3 mb-0 text-left">{error}</div>}

          {data && (
            <>
              <p className="text-muted text-small mb-4">Your payment for order {data.order.order_number} has been received.</p>

              <div
                style={{
                  background: "var(--ez-bg-body)",
                  borderRadius: "var(--ez-border-radius)",
                  padding: "1.25rem",
                  textAlign: "left",
                  marginBottom: "1.5rem"
                }}
              >
                <div className="d-flex justify-between mb-1">
                  <span className="text-small text-muted">Order Number</span>
                  <span className="text-small fw-600">{data.order.order_number}</span>
                </div>
                {data.invoice && (
                  <div className="d-flex justify-between mb-1">
                    <span className="text-small text-muted">Invoice Number</span>
                    <span className="text-small fw-600">{data.invoice.invoice_number}</span>
                  </div>
                )}
                <div className="d-flex justify-between mb-1">
                  <span className="text-small text-muted">Amount Paid</span>
                  <span className="text-small fw-600">{formatCurrency(data.invoice?.amount_paid ?? data.order.grand_total)}</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-small text-muted">Date</span>
                  <span className="text-small fw-600">{formatDateTime(data.order.updated_at)}</span>
                </div>
              </div>

              <div className="d-flex gap-2" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={`/exhibitor-zone/orders/${id}`} className="btn btn-primary">
                  View Order Details
                </Link>
                <Link href="/exhibitor-zone/catalogue" className="btn btn-outline-primary">
                  Continue Shopping
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
