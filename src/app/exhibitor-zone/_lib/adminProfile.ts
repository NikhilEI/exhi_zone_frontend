"use client";

import { useSearchParams } from "next/navigation";

// Every mandatory-form page supports an admin-editing mode: an admin visiting
// e.g. /mandatory-forms/exhibitor-information?profileId=16&company=Acme edits
// that exhibitor's data instead of their own. The backend's
// resolveTargetProfileId only honors ?profileId= for admin-tier roles, so a
// regular exhibitor passing this (or an admin without one) always just gets
// their own profile — this is purely a UI convenience on top of that.
export function useAdminProfileParam() {
  const params = useSearchParams();
  const raw = params.get("profileId");
  const profileId = raw ? Number(raw) : null;
  const company = params.get("company") || "";
  return { profileId, company };
}

// Appends ?profileId=<id> (or &profileId= if the path already has a query
// string) to a request path — pass this through every mandatory-forms/
// forms API call so admin-editing mode actually reaches the right exhibitor.
export function withProfileId(path: string, profileId: number | null): string {
  if (!profileId) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}profileId=${profileId}`;
}
