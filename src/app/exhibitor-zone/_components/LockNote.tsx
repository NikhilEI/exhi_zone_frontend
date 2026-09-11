// Shown under any mandatory-form input the organiser has locked (see the
// Mandatory Form Field Locks admin module) — shared across all 7 forms so
// the wording/style stays consistent everywhere.
export default function LockNote() {
  return (
    <div className="form-text" style={{ color: "var(--ez-text-muted, #6b7280)" }}>
      🔒 Locked by the organiser. Contact your organiser to change this.
    </div>
  );
}
