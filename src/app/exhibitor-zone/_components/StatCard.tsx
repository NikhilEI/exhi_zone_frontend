import Link from "next/link";
import { useCountUp } from "../_lib/useCountUp";

const COLOR_TOKENS: Record<string, { icon: string; bg: string }> = {
  primary: { icon: "var(--ez-primary)", bg: "var(--ez-primary-light)" },
  success: { icon: "#3a7d18", bg: "var(--ez-success-light)" },
  warning: { icon: "#806200", bg: "var(--ez-warning-light)" },
  danger: { icon: "#c0301a", bg: "var(--ez-danger-light)" },
  info: { icon: "#016a80", bg: "var(--ez-info-light)" },
  secondary: { icon: "var(--ez-muted)", bg: "#eceef1" }
};

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color?: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
  href?: string;
  sub?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export default function StatCard({ label, value, icon, color = "primary", href, sub, prefix = "", suffix = "", decimals = 0 }: StatCardProps) {
  const animated = useCountUp(value);
  const formatted = decimals > 0 ? animated.toFixed(decimals) : Math.round(animated).toLocaleString("en-IN");
  const tokens = COLOR_TOKENS[color] ?? COLOR_TOKENS.primary;

  const card = (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">
          {prefix}
          {formatted}
          {suffix}
        </div>
        {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
      </div>
      <div className="stat-card-icon" style={{ background: tokens.bg }}>
        <i className={`bx ${icon}`} style={{ fontSize: "1.5rem", color: tokens.icon }} />
      </div>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      {card}
    </Link>
  ) : (
    card
  );
}
