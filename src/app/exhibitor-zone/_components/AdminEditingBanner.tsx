import Link from "next/link";

// Shown at the top of every mandatory-form / additional-requirement page
// when an admin opened it via ?profileId=...&company=... (from the Exhibitor
// Progress detail page's "Edit" links) — makes it unmistakable whose data is
// on screen, since the form itself looks identical to the exhibitor's own view.
export default function AdminEditingBanner({ profileId, company }: { profileId: number; company: string }) {
  return (
    <div className="alert alert-warning mb-3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
      <span>
        <i className="bx bx-shield-quarter" /> <strong>Admin editing mode</strong> — you are editing this form on behalf of{" "}
        <strong>{company || `exhibitor profile #${profileId}`}</strong>, not your own account.
      </span>
      <Link href={`/exhibitor-zone/admin/exhibitor-progress/${profileId}?company=${encodeURIComponent(company)}`} className="btn btn-sm btn-outline-primary">
        <i className="bx bx-chevron-left" /> Back to Exhibitor Progress
      </Link>
    </div>
  );
}
