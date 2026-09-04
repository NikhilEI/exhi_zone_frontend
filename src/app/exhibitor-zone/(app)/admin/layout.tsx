"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAdminTier, useSession } from "../../_lib/SessionProvider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !isAdminTier(user.role)) {
      router.replace("/exhibitor-zone/dashboard");
    }
  }, [loading, user, router]);

  if (loading || !user || !isAdminTier(user.role)) {
    return (
      <div className="d-flex align-center justify-between" style={{ minHeight: "50vh", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return <>{children}</>;
}
