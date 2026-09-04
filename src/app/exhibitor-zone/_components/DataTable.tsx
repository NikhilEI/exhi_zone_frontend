"use client";

import { useMemo, useState } from "react";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  // Used for both sorting and the default text search when no render() is given.
  value?: (row: T) => string | number | null | undefined;
}

interface DataTableProps<T> {
  title?: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  keyField: (row: T) => string | number;
  searchPlaceholder?: string;
  emptyMessage?: string;
  actions?: (row: T) => React.ReactNode;
  loading?: boolean;
}

function getCellValue<T>(column: DataTableColumn<T>, row: T): string | number {
  if (column.value) return column.value(row) ?? "";
  const raw = (row as Record<string, unknown>)[column.key];
  return typeof raw === "number" ? raw : String(raw ?? "");
}

export default function DataTable<T>({
  title,
  columns,
  rows,
  keyField,
  searchPlaceholder = "Search…",
  emptyMessage = "No records found.",
  actions,
  loading = false
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => columns.some((col) => String(getCellValue(col, row)).toLowerCase().includes(needle)));
  }, [rows, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filtered;

    return [...filtered].sort((a, b) => {
      const av = getCellValue(column, a);
      const bv = getCellValue(column, b);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        {title ? <span className="card-title">{title}</span> : <span />}
        <div className="d-flex align-center gap-2" style={{ flexWrap: "wrap" }}>
          <input type="search" className="form-control" placeholder={searchPlaceholder} style={{ maxWidth: 240 }} value={search} onChange={(e) => setSearch(e.target.value)} />
          <span className="text-small text-muted">
            {sorted.length} of {rows.length}
          </span>
        </div>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} onClick={() => col.sortable !== false && toggleSort(col.key)} style={{ cursor: col.sortable !== false ? "pointer" : "default", userSelect: "none" }}>
                  {col.label}
                  {sortKey === col.key && <i className={`bx bx-chevron-${sortDir === "asc" ? "up" : "down"}`} style={{ marginLeft: "0.375rem" }} />}
                </th>
              ))}
              {actions && <th />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner" />
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="text-muted" style={{ textAlign: "center", padding: "2rem" }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr key={keyField(row)}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : getCellValue(col, row)}</td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
