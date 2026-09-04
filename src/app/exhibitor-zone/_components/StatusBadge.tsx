const VARIANT_MAP: Record<string, string> = {
  pending: "warning",
  submitted: "warning",
  under_review: "warning",
  needs_info: "warning",
  changes_requested: "warning",
  draft: "secondary",
  approved: "success",
  active: "success",
  issued: "success",
  paid: "success",
  published: "success",
  available: "success",
  rejected: "danger",
  failed: "danger",
  voided: "danger",
  cancelled: "danger",
  suspended: "secondary",
  disabled: "secondary",
  unpaid: "danger",
  partially_paid: "warning",
  refunded: "info",
  booked: "info",
  blocked: "secondary",
  used: "secondary",
  lost: "danger"
};

function toLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StatusBadge({ status }: { status: string }) {
  const variant = VARIANT_MAP[status] || "primary";
  return <span className={`badge badge-${variant}`}>{toLabel(status)}</span>;
}
