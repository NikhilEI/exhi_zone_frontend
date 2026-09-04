"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  label: string;
  href?: string;
  icon?: string;
  badge?: string | number;
}

interface SidebarProps {
  items: NavItem[];
  appName?: string;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname();
  const isActive = item.href ? pathname === item.href || pathname.startsWith(`${item.href}/`) : false;

  if (!item.href) {
    return (
      <li className="menu-header">
        <span className="menu-header-text">{item.label}</span>
      </li>
    );
  }

  const isExternal = item.href.startsWith("http");

  if (isExternal) {
    return (
      <li className="menu-item">
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="menu-link" onClick={onNavigate}>
          {item.icon && <i className={`menu-icon bx ${item.icon}`} />}
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", width: "100%" }}>
            {item.label}
            <i className="bx bx-link-external text-muted" style={{ fontSize: "0.75rem", opacity: 0.7 }} />
          </span>
        </a>
      </li>
    );
  }

  return (
    <li className={`menu-item ${isActive ? "active" : ""}`}>
      <Link href={item.href} className={`menu-link ${isActive ? "active" : ""}`} onClick={onNavigate}>
        {item.icon && <i className={`menu-icon bx ${item.icon}`} />}
        <span>{item.label}</span>
        {item.badge !== undefined && Number(item.badge) > 0 && <span className="menu-badge">{item.badge}</span>}
      </Link>
    </li>
  );
}

export default function Sidebar({ items, appName = "Exhibitor Zone", isOpen, onClose, isCollapsed }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="sidebar-overlay"
          style={{ position: "fixed", inset: 0, background: "rgba(35,52,70,0.45)", zIndex: 1040, display: "none" }}
          aria-hidden="true"
        />
      )}

      <aside className={`layout-menu ${isOpen ? "open" : ""} ${isCollapsed ? "collapsed" : ""}`} aria-label="Sidebar navigation">
        <div className="app-brand">
          <Link
            href={items[1]?.href || "/exhibitor-zone"}
            className="app-brand-link"
            onClick={onClose}
            style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}
          >
            <img src="/images/exhibitor-zone-logo.jpg" alt="Exhibitor Zone" className="app-brand-logo-img" />
            <span className="app-brand-text" style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ez-muted)" }}>
              {appName}
            </span>
            {isCollapsed && (
              <span
                className="app-brand-mark"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--ez-primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.9rem"
                }}
              >
                W
              </span>
            )}
          </Link>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ display: "none" }}
            aria-label="Close sidebar"
            id="sidebarCloseBtn"
          >
            <i className="bx bx-x" style={{ fontSize: "1.5rem" }} />
          </button>
        </div>

        <ul className="menu-inner py-1" role="menubar">
          {items.map((item, i) => (
            <NavLink key={`${item.label}-${i}`} item={item} onNavigate={onClose} />
          ))}
        </ul>
      </aside>
    </>
  );
}
