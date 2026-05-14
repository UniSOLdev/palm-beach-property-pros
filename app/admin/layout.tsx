import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminDbBanner } from "@/components/admin/admin-db-banner";
import { AdminShell } from "@/components/admin/admin-shell";

/** Always SSR the admin tree so production never relies on a stale or missing prerendered HTML shell for /admin. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <AdminDbBanner />
      {children}
    </AdminShell>
  );
}
