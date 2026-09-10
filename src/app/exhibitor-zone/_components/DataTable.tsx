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
  // Rows per page. Every list built on DataTable gets pagination for free;
  // pass a larger number (or Infinity) for the rare list that shouldn't paginate.
  pageSize?: number;
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
  loading = false,
  pageSize = 20
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Clamp rather than reset-via-effect: if a search/sort/data change shrinks
  // the result set out from under the current page, this just settles on the
  // new last page instead of needing a dedicated effect to watch for it.
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(() => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize), [sorted, currentPage, pageSize]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, sorted.length);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        {title ? <span className="card-title">{title}</span> : <span />}
        <div className="d-flex align-center gap-2" style={{ flexWrap: "wrap" }}>
          <input type="search" className="form-control" placeholder={searchPlaceholder} style={{ maxWidth: 240 }} value={search} onChange={(e) => handleSearchChange(e.target.value)} />
          <span className="text-small text-muted">
            {sorted.length > 0 ? `${rangeStart}–${rangeEnd} of ${sorted.length}` : `0 of ${rows.length}`}
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
              pageRows.map((row) => (
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

      {!loading && totalPages > 1 && (
        <div className="d-flex align-center justify-between" style={{ padding: "0.875rem 1.25rem", borderTop: "1px solid var(--ez-divider)", flexWrap: "wrap", gap: "0.5rem" }}>
          <button type="button" className="btn btn-ghost btn-sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            <i className="bx bx-chevron-left" /> Prev
          </button>
          <span className="text-small text-muted">
            Page {currentPage} of {totalPages}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
            Next <i className="bx bx-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
