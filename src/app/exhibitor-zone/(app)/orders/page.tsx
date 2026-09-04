"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../_lib/apiClient";
import { formatCurrency, formatDate } from "../../_lib/format";
import StatusBadge from "../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../_components/DataTable";

interface Order {
  id: number;
  order_number: string;
  grand_total: string;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ orders: Order[] }>("/orders")
      .then((body) => setOrders(body.orders))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load orders."))
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<Order>[] = [
    { key: "order_number", label: "Order #" },
    { key: "created_at", label: "Date", render: (o) => formatDate(o.created_at) },
    { key: "grand_total", label: "Total", value: (o) => Number(o.grand_total), render: (o) => formatCurrency(o.grand_total) },
    { key: "status", label: "Status", render: (o) => <StatusBadge status={o.status} /> },
    { key: "payment_status", label: "Payment", render: (o) => <StatusBadge status={o.payment_status} /> }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Orders &amp; Invoices</h1>
        <p className="content-subtitle">Track service orders, payment status, and invoices for your booth</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={orders}
        keyField={(o) => o.id}
        loading={loading}
        searchPlaceholder="Search orders…"
        emptyMessage="No orders yet."
        actions={(o) => (
          <Link href={`/exhibitor-zone/orders/${o.id}`} className="btn btn-ghost btn-sm">
            View
          </Link>
        )}
      />
    </>
  );
}
