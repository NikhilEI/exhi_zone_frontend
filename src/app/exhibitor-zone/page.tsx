"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "./_lib/apiClient";
import { isAdminTier, type SessionUser } from "./_lib/SessionProvider";

export default function ExhibitorZoneIndexPage() {
  const router = useRouter();

  useEffect(() => {
    api
      .get<{ user: SessionUser }>("/auth/me")
      .then((body) => {
        router.replace(isAdminTier(body.user.role) ? "/exhibitor-zone/admin/dashboard" : "/exhibitor-zone/dashboard");
      })
      .catch(() => router.replace("/exhibitor-zone/login"));
  }, [router]);

  return null;
}
