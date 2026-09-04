"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "../../../_lib/apiClient";
import { formatCurrency, formatDateTime } from "../../../_lib/format";
import DataTable, { type DataTableColumn } from "../../../_components/DataTable";

interface CartSummary {
  profileId: number;
  companyName: string;
  status: string;
  itemCount: number;
  grandTotal: number;
  updatedAt: string;
}

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<CartSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ carts: CartSummary[] }>("/cart/all")
      .then((body) => setCarts(body.carts))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load carts."))
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<CartSummary>[] = [
    {
      key: "companyName",
      label: "Company",
      render: (c) => <Link href={`/exhibitor-zone/admin/carts/${c.profileId}`} className="fw-600">{c.companyName}</Link>
    },
    { key: "itemCount", label: "Items" },
    { key: "grandTotal", label: "Cart Total", render: (c) => formatCurrency(c.grandTotal) },
    { key: "updatedAt", label: "Last Updated", render: (c) => formatDateTime(c.updatedAt) }
  ];

  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Exhibitor Carts</h1>
        <p className="content-subtitle">See what every exhibitor currently has in their active cart</p>
      </div>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <DataTable
        columns={columns}
        rows={carts}
        keyField={(c) => c.profileId}
        loading={loading}
        searchPlaceholder="Search carts…"
        emptyMessage="No exhibitor has anything in their cart right now."
        actions={(c) => (
          <Link href={`/exhibitor-zone/admin/carts/${c.profileId}`} className="btn btn-sm btn-outline-primary">
            View / Manage
          </Link>
        )}
      />
    </>
  );
}
