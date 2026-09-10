"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatCurrency, formatDateTime } from "../../../_lib/format";
import StatusBadge from "../../../_components/StatusBadge";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface Transaction {
  id: number;
  order_id: number;
  order_number: string;
  company_name: string;
  gateway: string;
  amount: string;
  currency: string;
  status: string;
  gateway_status: string | null;
  payment_method: string | null;
  processed_at: string | null;
  created_at: string;
}

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ transactions: Transaction[] }>("/payments/admin")
      .then((body) => setTransactions(body.transactions))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load payments."))
      .finally(() => setLoading(false));
  }, []);

  const successCount = transactions.filter((t) => t.status === "success").length;
  const totalCollected = transactions.filter((t) => t.status === "success").reduce((sum, t) => sum + Number(t.amount), 0);

  const columns: DataTableColumn<Transaction>[] = [
    { key: "order_number", label: "Order #" },
    { key: "company_name", label: "Company" },
    { key: "created_at", label: "Date", render: (t) => formatDateTime(t.created_at) },
    { key: "amount", label: "Amount", value: (t) => Number(t.amount), render: (t) => formatCurrency(t.amount, t.currency) },
    { key: "gateway", label: "Gateway", render: (t) => t.gateway.charAt(0).toUpperCase() + t.gateway.slice(1) },
    { key: "payment_method", label: "Method", render: (t) => t.payment_method || "—" },
    { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Payments</h1>
        <p className="content-subtitle">Every payment gateway transaction across all exhibitors this event</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <div className="grid grid-2 mb-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="text-small text-muted mb-1">Total Transactions</div>
          <div className="fw-700" style={{ fontSize: "1.5rem", color: "var(--ez-dark)" }}>
            {transactions.length}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="text-small text-muted mb-1">Successful Payments</div>
          <div className="fw-700" style={{ fontSize: "1.5rem", color: "var(--ez-success)" }}>
            {successCount}
          </div>
        </div>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="text-small text-muted mb-1">Total Collected</div>
          <div className="fw-700" style={{ fontSize: "1.5rem", color: "var(--ez-primary)" }}>
            {formatCurrency(totalCollected)}
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={transactions}
        keyField={(t) => t.id}
        loading={loading}
        searchPlaceholder="Search by order # or company…"
        emptyMessage="No payments yet."
        actions={(t) => (
          <Link href={`/exhibitor-zone/admin/orders/${t.order_id}`} className="btn btn-ghost btn-sm">
            View Order
          </Link>
        )}
      />
    </>
  );
}
