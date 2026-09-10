"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../_lib/apiClient";
import { formatCurrency, formatDateTime } from "../../_lib/format";
import StatusBadge from "../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../_components/DataTable";

interface Transaction {
  id: number;
  order_id: number;
  order_number: string;
  gateway: string;
  amount: string;
  currency: string;
  status: string;
  gateway_status: string | null;
  payment_method: string | null;
  processed_at: string | null;
  created_at: string;
}

export default function PaymentHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ transactions: Transaction[] }>("/payments/mine")
      .then((body) => setTransactions(body.transactions))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load payment history."))
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<Transaction>[] = [
    { key: "order_number", label: "Order #" },
    { key: "created_at", label: "Date", render: (t) => formatDateTime(t.created_at) },
    { key: "amount", label: "Amount", value: (t) => Number(t.amount), render: (t) => formatCurrency(t.amount, t.currency) },
    { key: "gateway", label: "Gateway", render: (t) => t.gateway.charAt(0).toUpperCase() + t.gateway.slice(1) },
    { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Payment History</h1>
        <p className="content-subtitle">Every payment attempt made against your orders</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={transactions}
        keyField={(t) => t.id}
        loading={loading}
        searchPlaceholder="Search payments…"
        emptyMessage="No payments yet."
        actions={(t) => (
          <Link href={`/exhibitor-zone/orders/${t.order_id}`} className="btn btn-ghost btn-sm">
            View Order
          </Link>
        )}
      />
    </>
  );
}
