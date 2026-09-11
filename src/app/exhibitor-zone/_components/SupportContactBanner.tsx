// Shown at the top of every mandatory-form page so an exhibitor who runs
// into trouble submitting knows exactly who at the organiser to reach out
// to, without having to dig for contact details elsewhere.
const CONTACTS = [
  { name: "Ravi Kumar", phone: "+91 11 4279 5042", mobile: "+91 85271 65718", email: "ravik@eigroup.in" },
  { name: "Vipin Kumar", phone: "+91 11 4279 5042", mobile: "+91 96678 46729", email: "vipink@eigroup.in" }
];

export default function SupportContactBanner() {
  return (
    <div className="card mb-3">
      <div className="card-body" style={{ padding: "0.875rem 1.25rem" }}>
        <div className="text-small fw-600 mb-2" style={{ color: "var(--ez-dark)" }}>
          <i className="bx bx-support" /> For more information, please contact:
        </div>
        <div className="grid grid-2" style={{ gap: "1rem" }}>
          {CONTACTS.map((c) => (
            <div key={c.email} className="text-small">
              <div className="fw-600">{c.name}</div>
              <div>Ph. {c.phone}</div>
              <div>Mob: {c.mobile}</div>
              <div>
                Email:{" "}
                <a href={`mailto:${c.email}`}>{c.email}</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
