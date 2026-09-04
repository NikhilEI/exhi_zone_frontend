"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, isAdminTier } from "../_lib/SessionProvider";
import { api } from "../_lib/apiClient";
import Sidebar, { type NavItem } from "../_components/Sidebar";
import Topbar from "../_components/Topbar";

const EXHIBITOR_NAV: NavItem[] = [
  { label: "Main" },
  { label: "Dashboard", href: "/exhibitor-zone/dashboard", icon: "bx-home-circle" },
  { label: "Company Profile", href: "/exhibitor-zone/profile", icon: "bx-buildings" },
  { label: "Notifications", href: "/exhibitor-zone/notifications", icon: "bx-bell" },
  { label: "Mandatory Forms" },
  { label: "Mandatory Forms", href: "/exhibitor-zone/mandatory-forms", icon: "bx-list-check" },
  { label: "Event Services" },
  { label: "Service Catalogue", href: "/exhibitor-zone/catalogue", icon: "bx-store" },
  { label: "My Cart", href: "/exhibitor-zone/cart", icon: "bx-cart", badge: 0 },
  { label: "Orders & Invoices", href: "/exhibitor-zone/orders", icon: "bx-receipt" },
  { label: "Additional Requirements" },
  { label: "Translators", href: "/exhibitor-zone/services/translators", icon: "bx-conversation" },
  { label: "Security Personnel", href: "/exhibitor-zone/services/security-personnel", icon: "bx-shield" },
  { label: "Additional Power Supply", href: "/exhibitor-zone/services/additional-power-supply", icon: "bx-bolt-circle" },
  { label: "Outdoor Space", href: "/exhibitor-zone/services/outdoor-space", icon: "bx-move" },
  { label: "Compliance" },
  { label: "Forms", href: "/exhibitor-zone/forms", icon: "bx-list-check" },
  { label: "Documents", href: "/exhibitor-zone/documents", icon: "bx-folder" },
  { label: "Access" },
  { label: "My Passes", href: "/exhibitor-zone/passes", icon: "bx-id-card" },
  { label: "Information List" },
  { label: "Site Plan", href: "/exhibitor-zone/info/site-plan", icon: "bx-map-alt" },
  { label: "Empanelled Contractors", href: "https://www.convergenceindia.org/empanelled-contractors.aspx", icon: "bx-hammer" },
  { label: "Freight Forwarder", href: "https://www.convergenceindia.org/freight_forwarder.aspx", icon: "bx-truck" },
  { label: "Settings" },
  { label: "Account Settings", href: "/exhibitor-zone/account-settings", icon: "bx-cog" }
];

const ADMIN_NAV: NavItem[] = [
  { label: "Operations" },
  { label: "Dashboard", href: "/exhibitor-zone/admin/dashboard", icon: "bx-home-circle" },
  { label: "Events", href: "/exhibitor-zone/admin/events", icon: "bx-calendar" },
  { label: "Exhibitor Management" },
  { label: "Registrations", href: "/exhibitor-zone/admin/registrations", icon: "bx-user-plus" },
  { label: "Exhibitor CRM", href: "/exhibitor-zone/admin/companies", icon: "bx-buildings" },
  { label: "Stall Grid", href: "/exhibitor-zone/admin/stalls", icon: "bx-grid-alt" },
  { label: "Commerce" },
  { label: "Service Catalogue", href: "/exhibitor-zone/admin/catalogue", icon: "bx-store" },
  { label: "Carts", href: "/exhibitor-zone/admin/carts", icon: "bx-cart" },
  { label: "Orders & Invoices", href: "/exhibitor-zone/admin/orders", icon: "bx-receipt" },
  { label: "Access & Compliance" },
  { label: "Pass Management", href: "/exhibitor-zone/admin/passes", icon: "bx-id-card" },
  { label: "Mandatory Forms", href: "/exhibitor-zone/admin/mandatory-forms", icon: "bx-list-check" },
  { label: "Form Reviews", href: "/exhibitor-zone/admin/forms", icon: "bx-list-check" },
  { label: "Communication" },
  { label: "Send Notification", href: "/exhibitor-zone/admin/notifications", icon: "bx-bell" },
  { label: "Admin" },
  { label: "Admin Users", href: "/exhibitor-zone/admin/users", icon: "bx-user-circle" }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [mandatoryPendingCount, setMandatoryPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/exhibitor-zone/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || isAdminTier(user.role)) return;
    api
      .get<{ items: { quantity: number }[] }>("/cart")
      .then((body) => setCartCount(body.items.reduce((sum, i) => sum + i.quantity, 0)))
      .catch(() => {});
    api
      .get<{ forms: { status: string }[] }>("/mandatory-forms")
      .then((body) => setMandatoryPendingCount(body.forms.filter((f) => f.status !== "completed").length))
      .catch(() => {});
  }, [user]);

  function handleMenuToggle() {
    if (window.innerWidth <= 1200) {
      setSidebarOpen((o) => !o);
    } else {
      setSidebarCollapsed((o) => !o);
    }
  }

  if (loading || !user) {
    return (
      <div className="d-flex align-center justify-between" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  const admin = isAdminTier(user.role);
  const navItems = (admin ? ADMIN_NAV : EXHIBITOR_NAV).map((item) => {
    if (item.label === "My Cart" && item.href) return { ...item, badge: cartCount };
    if (item.label === "Mandatory Forms" && item.href) return { ...item, badge: mandatoryPendingCount };
    return item;
  });

  return (
    <div className="layout-wrapper">
      <div className="layout-container">
        <Sidebar items={navItems} appName={admin ? "Admin CMS" : "Exhibitor Zone"} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} />

        <div className="layout-page">
          <Topbar onMenuToggle={handleMenuToggle} eventName="Wellness India Expo 2027" />

          <div className="content-wrapper">
            <div style={{ minHeight: "calc(100vh - var(--ez-navbar-height) - 10rem)" }}>{children}</div>

            <footer className="layout-footer" style={{ borderTop: "1px solid var(--ez-divider)", paddingTop: "1.5rem", marginTop: "3rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <p className="text-muted text-xs mb-0">© {new Date().getFullYear()} Wellness India Expo. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
