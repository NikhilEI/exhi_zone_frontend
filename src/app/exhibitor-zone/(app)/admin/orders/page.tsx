"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatCurrency, formatDate } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Order {
  id: number;
  order_number: string;
  company_name: string;
  grand_total: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    setLoading(true);
    api
      .get<{ orders: Order[] }>("/orders")
      .then((body) => setOrders(body.orders))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load orders."))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(load, []);

  async function markPaid(id: number) {
    setMessage("");
    setError("");
    try {
      await api.patch(`/orders/${id}/payment-status`, { paymentStatus: "paid" });
      setMessage("Order marked as paid.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update order.");
    }
  }

  const columns: DataTableColumn<Order>[] = [
    {
      key: "order_number",
      label: "Order #",
      render: (o) => (
        <Link href={`/exhibitor-zone/admin/orders/${o.id}`} className="fw-600">
          {o.order_number}
        </Link>
      )
    },
    { key: "company_name", label: "Company" },
    { key: "created_at", label: "Date", render: (o) => formatDate(o.created_at) },
    { key: "grand_total", label: "Total", value: (o) => Number(o.grand_total), render: (o) => formatCurrency(o.grand_total) },
    { key: "status", label: "Status", render: (o) => <StatusBadge status={o.status} /> },
    { key: "payment_status", label: "Payment", render: (o) => <StatusBadge status={o.payment_status} /> }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Orders &amp; Invoices</h1>
        <p className="content-subtitle">Track exhibitor service orders and reconcile payment status</p>
      </div>

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={orders}
        keyField={(o) => o.id}
        loading={loading}
        searchPlaceholder="Search orders…"
        emptyMessage="No orders yet."
        actions={(o) =>
          o.payment_status !== "paid" ? (
            <button type="button" className="btn btn-sm btn-success" onClick={() => markPaid(o.id)}>
              Mark Paid
            </button>
          ) : null
        }
      />
    </>
  );
}
