"use client";

export default function InternetConnectivityPage() {
  return (
    <>
      <div className="content-header">
        <h1 className="content-title">Internet Connectivity Requirements</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <p className="text-small" style={{ color: "var(--ez-dark)" }}>
            For any internet-related requirements during the exhibition, including internet connections for exhibitor
            booths, Wi-Fi access, dedicated leased lines, bandwidth upgrades, or any technical assistance related to
            internet services, kindly get in touch with the designated coordinator below:
          </p>

          <div
            className="d-flex align-center gap-3"
            style={{ marginTop: "1.5rem", padding: "1.25rem", background: "var(--ez-bg-body)", borderRadius: "var(--ez-border-radius-lg)", border: "1px solid var(--ez-border)" }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--ez-primary-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <i className="bx bx-user" style={{ fontSize: "1.5rem", color: "var(--ez-primary)" }} />
            </div>
            <div>
              <div className="fw-700" style={{ color: "var(--ez-dark)" }}>
                Amarjeet
              </div>
              <a href="tel:+919212168823" className="text-small" style={{ color: "var(--ez-primary)" }}>
                <i className="bx bx-phone" /> +91 92121 68823
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
