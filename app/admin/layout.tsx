import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminDbBanner } from "@/components/admin/admin-db-banner";
import { AdminShell } from "@/components/admin/admin-shell";

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
