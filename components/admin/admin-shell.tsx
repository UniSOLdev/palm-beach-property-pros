"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <div className="min-h-screen bg-[#07090d] text-zinc-100">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#07090d] text-zinc-100 md:flex-row">
      <aside className="border-b border-white/[0.08] bg-black/40 px-4 py-4 backdrop-blur-xl md:w-56 md:border-b-0 md:border-r md:py-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/90">
          PBPP Operations
        </p>
        <p className="mt-1 text-xs text-zinc-500">Property operations console</p>
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
          <AdminNavLink href="/admin/invoices/new" current={pathname}>
            New invoice
          </AdminNavLink>
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 no-underline transition hover:bg-white/5 hover:text-zinc-200"
          >
            ← Public site
          </Link>
        </nav>
        <div className="mt-8 flex flex-col gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/10"
            onClick={async () => {
              await fetch("/api/admin/logout", { method: "POST" });
              window.location.href = "/admin/login";
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 overflow-x-hidden px-4 py-6 md:px-10 md:py-10">{children}</div>
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
      className={`rounded-lg px-3 py-2 text-sm font-medium no-underline transition ${
        active
          ? "bg-sky-500/15 text-sky-100 ring-1 ring-sky-400/30"
          : "text-zinc-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
