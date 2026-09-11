"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "./apiClient";

export type ExhibitorRole = "super_admin" | "organiser" | "finance" | "exhibitor_admin" | "exhibitor_staff" | "operations" | "sales";

export interface SessionUser {
  id: number;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ExhibitorRole;
  companyId: number | null;
  eventId: number | null;
  // Only meaningful for role "operations"/"sales" — the admin nav uses this
  // to hide modules the account hasn't been granted. Empty/ignored otherwise.
  enabledModules: string[];
}

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const body = await api.get<{ user: SessionUser }>("/auth/me");
      setUser(body.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Already logged out server-side (e.g. expired session) — proceed regardless.
    }
    setUser(null);
  }, []);

  useEffect(() => {
    // Standard fetch-on-mount: setState happens inside refresh()'s async
    // callback after the request resolves, not synchronously in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return <SessionContext.Provider value={{ user, loading, refresh, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider.");
  return ctx;
}

export const ADMIN_TIER_ROLES: ExhibitorRole[] = ["super_admin", "organiser", "finance", "operations", "sales"];

export function isAdminTier(role: ExhibitorRole | undefined) {
  return Boolean(role && ADMIN_TIER_ROLES.includes(role));
}

// Only operations/sales are restricted to their enabledModules list — every
// other admin-tier role always has full access to every admin nav item.
export const MODULE_GATED_ROLES: ExhibitorRole[] = ["operations", "sales"];

export function isModuleGated(role: ExhibitorRole | undefined) {
  return Boolean(role && MODULE_GATED_ROLES.includes(role));
}

export { ApiError };
