"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OpsMobileBar } from "@/components/admin/ops-mobile-bar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <div className="admin-bg min-h-screen">{children}</div>;
  }

  return (
    <div className="admin-bg flex min-h-screen flex-col md:flex-row">
      <aside className="admin-shell-panel border-b px-4 py-4 md:w-60 md:border-b-0 md:border-r md:py-8">
        <p className="admin-kicker">PBPP Operations</p>
        <p className="mt-1 text-xs text-silver">Luxury field service OS</p>
        <nav className="mt-6 flex flex-wrap gap-2 md:flex-col md:gap-1">
          <AdminNavLink href="/admin" current={pathname}>
            Dashboard
          </AdminNavLink>
          <AdminNavLink href="/admin/jobs" current={pathname}>
            Jobs
          </AdminNavLink>
          <AdminNavLink href="/admin/expenses" current={pathname}>
            Expenses
          </AdminNavLink>
          <AdminNavLink href="/admin/supplies" current={pathname}>
            Inventory
          </AdminNavLink>
          <AdminNavLink href="/admin/crew" current={pathname}>
            Crew
          </AdminNavLink>
          <AdminNavLink href="/admin/website" current={pathname}>
            Website
          </AdminNavLink>
          <AdminNavLink href="/admin/clients" current={pathname}>
            Clients
          </AdminNavLink>
          <AdminNavLink href="/admin/invoices" current={pathname}>
            Invoices
          </AdminNavLink>
          <AdminNavLink href="/admin/invoices/new" current={pathname}>
            New invoice
          </AdminNavLink>
          <Link
            href="/"
            className="rounded-xl px-3 py-2.5 text-sm text-silver no-underline transition hover:bg-white/5 hover:text-cream"
          >
            ← Public site
          </Link>
        </nav>
        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            className="admin-action-secondary w-full justify-start"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 overflow-x-hidden px-4 py-5 pb-28 md:px-8 md:py-8 md:pb-10 lg:px-10">{children}</div>
      <OpsMobileBar />
    </div>
  );
}

function AdminNavLink({
  href,
  current,
  children,
}: {
  href: string;
  current: string | null;
  children: React.ReactNode;
}) {
  const active =
    href === "/admin"
      ? current === "/admin"
      : current === href || (current?.startsWith(`${href}/`) ?? false);
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition ${
        active
          ? "bg-aqua/15 text-cream ring-1 ring-aqua/35"
          : "text-silver hover:bg-white/5 hover:text-cream"
      }`}
    >
      {children}
    </Link>
  );
}
