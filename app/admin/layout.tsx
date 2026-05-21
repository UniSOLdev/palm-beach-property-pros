import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6 min-h-[calc(100vh-4rem)] w-[calc(100%+3rem)] max-w-[100vw]">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
