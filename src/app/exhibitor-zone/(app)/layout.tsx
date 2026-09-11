"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, isAdminTier, isModuleGated } from "../_lib/SessionProvider";
import { api } from "../_lib/apiClient";
import Sidebar, { type NavItem } from "../_components/Sidebar";
import Topbar from "../_components/Topbar";

const EXHIBITOR_NAV: NavItem[] = [
  { label: "Main" },
  { label: "Dashboard", href: "/exhibitor-zone/dashboard", icon: "bx-home-circle" },
  // { label: "Company Profile", href: "/exhibitor-zone/profile", icon: "bx-buildings" }, // hidden for now, not needed
  { label: "Notifications", href: "/exhibitor-zone/notifications", icon: "bx-bell" },
  { label: "Mandatory Forms" },
  { label: "Mandatory Forms", href: "/exhibitor-zone/mandatory-forms", icon: "bx-list-check" },
  { label: "Event Services" },
  { label: "Service Catalogue", href: "/exhibitor-zone/catalogue", icon: "bx-store" },
  { label: "My Cart", href: "/exhibitor-zone/cart", icon: "bx-cart", badge: 0 },
  { label: "Orders & Invoices", href: "/exhibitor-zone/orders", icon: "bx-receipt" },
  { label: "Payment History", href: "/exhibitor-zone/payments", icon: "bx-credit-card" },
  { label: "Additional Requirements" },
  { label: "Translators", href: "/exhibitor-zone/services/translators", icon: "bx-conversation" },
  { label: "Security Personnel", href: "/exhibitor-zone/services/security-personnel", icon: "bx-shield" },
  { label: "Additional Power Supply", href: "/exhibitor-zone/services/additional-power-supply", icon: "bx-bolt-circle" },
  { label: "Outdoor Space", href: "/exhibitor-zone/services/outdoor-space", icon: "bx-move" },
  { label: "Internet Connectivity", href: "/exhibitor-zone/services/internet-connectivity", icon: "bx-wifi" },
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
  { label: "Exhibitor Progress", href: "/exhibitor-zone/admin/exhibitor-progress", icon: "bx-line-chart" },
  { label: "Stall Grid", href: "/exhibitor-zone/admin/stalls", icon: "bx-grid-alt" },
  { label: "Commerce" },
  { label: "Service Catalogue", href: "/exhibitor-zone/admin/catalogue", icon: "bx-store" },
  { label: "Carts", href: "/exhibitor-zone/admin/carts", icon: "bx-cart" },
  { label: "Orders & Invoices", href: "/exhibitor-zone/admin/orders", icon: "bx-receipt" },
  { label: "Payments", href: "/exhibitor-zone/admin/payments", icon: "bx-credit-card" },
  { label: "Access & Compliance" },
  { label: "Pass Management", href: "/exhibitor-zone/admin/passes", icon: "bx-id-card" },
  { label: "Mandatory Forms", href: "/exhibitor-zone/admin/mandatory-forms", icon: "bx-list-check" },
  { label: "Additional Requirements", href: "/exhibitor-zone/admin/services", icon: "bx-toggle-left" },
  { label: "Form Reviews", href: "/exhibitor-zone/admin/forms", icon: "bx-list-check" },
  { label: "Exhibitor Documents", href: "/exhibitor-zone/admin/documents", icon: "bx-upload" },
  { label: "Communication" },
  { label: "Send Notification", href: "/exhibitor-zone/admin/notifications", icon: "bx-bell" },
  { label: "Reports" },
  { label: "Export Data", href: "/exhibitor-zone/admin/exports", icon: "bx-download" },
  { label: "Legacy Import", href: "/exhibitor-zone/admin/legacy-import", icon: "bx-upload" },
  { label: "Admin" },
  { label: "Admin Users", href: "/exhibitor-zone/admin/users", icon: "bx-user-circle" }
];

// Maps each admin nav href to the module key it's gated by on the backend
// (see backend/src/config/adminModules.js) — only consulted for
// operations/sales accounts; every other admin-tier role sees every item.
// Admin Users and Legacy Import have no entry here because they're never
// assignable to operations/sales — the backend restricts both to super_admin
// regardless of enabledModules, so the links stay hidden for those roles too.
const NAV_HREF_TO_MODULE: Record<string, string> = {
  "/exhibitor-zone/admin/dashboard": "dashboard",
  "/exhibitor-zone/admin/events": "events",
  "/exhibitor-zone/admin/registrations": "registrations",
  "/exhibitor-zone/admin/companies": "companies",
  "/exhibitor-zone/admin/exhibitor-progress": "exhibitor-progress",
  "/exhibitor-zone/admin/stalls": "stalls",
  "/exhibitor-zone/admin/catalogue": "catalogue",
  "/exhibitor-zone/admin/carts": "carts",
  "/exhibitor-zone/admin/orders": "orders",
  "/exhibitor-zone/admin/payments": "payments",
  "/exhibitor-zone/admin/passes": "passes",
  "/exhibitor-zone/admin/mandatory-forms": "mandatory-forms",
  "/exhibitor-zone/admin/services": "services",
  "/exhibitor-zone/admin/forms": "forms",
  "/exhibitor-zone/admin/documents": "documents",
  "/exhibitor-zone/admin/notifications": "notifications",
  "/exhibitor-zone/admin/exports": "exports"
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [mandatoryPendingCount, setMandatoryPendingCount] = useState(0);
  const [activeServiceSlugs, setActiveServiceSlugs] = useState<Set<string> | null>(null);

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
    api
      .get<{ additional: { slug: string }[] }>("/forms/templates")
      .then((body) => setActiveServiceSlugs(new Set(body.additional.map((t) => t.slug))))
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
  const navItems = (admin ? ADMIN_NAV : EXHIBITOR_NAV)
    .filter((item) => {
      // Legacy Import creates real login accounts/orders in bulk — the
      // backend restricts it to super_admin only, so hide the link for
      // organiser/finance admins rather than showing a link that 403s.
      if (item.href === "/exhibitor-zone/admin/legacy-import" && user.role !== "super_admin") return false;
      if (item.href === "/exhibitor-zone/admin/users" && user.role !== "super_admin") return false;
      // Operations/sales only see the admin modules their account was
      // granted — everyone else (super_admin/organiser/finance) sees every item.
      if (admin && isModuleGated(user.role) && item.href) {
        const moduleKey = NAV_HREF_TO_MODULE[item.href];
        if (moduleKey && !user.enabledModules.includes(moduleKey)) return false;
      }
      if (admin || !item.href || !activeServiceSlugs) return true;
      const match = item.href.match(/^\/exhibitor-zone\/services\/([^/]+)$/);
      // Only slugs with a form_templates row participate in the admin
      // enable/disable toggle — "internet-connectivity" is a static contact
      // page with no backing template, so it's always shown.
      if (!match || match[1] === "internet-connectivity") return true;
      return activeServiceSlugs.has(match[1]);
    })
    .map((item) => {
      if (item.label === "My Cart" && item.href) return { ...item, badge: cartCount };
      if (item.label === "Mandatory Forms" && item.href) return { ...item, badge: mandatoryPendingCount };
      return item;
    });

  return (
    <div className="layout-wrapper">
      <div className="layout-container">
        <Sidebar items={navItems} appName={admin ? "Admin CMS" : "Exhibitor Zone"} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} />

        <div className="layout-page">
          <Topbar onMenuToggle={handleMenuToggle} eventName="Convergence India Expo 2027" />

          <div className="content-wrapper">
            <div style={{ minHeight: "calc(100vh - var(--ez-navbar-height) - 10rem)" }}>{children}</div>

            <footer className="layout-footer" style={{ borderTop: "1px solid var(--ez-divider)", paddingTop: "1.5rem", marginTop: "3rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <p className="text-muted text-xs mb-0">© {new Date().getFullYear()} Convergence India Expo. All rights reserved.</p>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
