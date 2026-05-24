"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AdminToastProvider } from "@/components/admin/admin-toast";
import { ADMIN_MORE_NAV, ADMIN_NAV, QUICK_ACTIONS } from "@/lib/admin/constants";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const isWideStudio =
    pathname.startsWith("/admin/website/builder") || pathname.startsWith("/admin/website/pages");
  const mainMaxWidth = isWideStudio ? "max-w-7xl" : "max-w-3xl";
  const [fabOpen, setFabOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  if (isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream via-white to-sky/20 px-4 py-8 text-charcoal">
        <div className="mx-auto max-w-md">{children}</div>
      </div>
    );
  }


  return (
    <AdminToastProvider>
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-sky/20 text-charcoal">
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-cream/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-ocean">PBPP Ops</p>
            <p className="text-sm font-bold text-navy">Field Operations</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className="admin-btn-secondary min-h-[44px] px-3 text-xs"
              aria-expanded={moreOpen}
            >
              More
            </button>
            <form action="/admin/auth/signout" method="post">
              <button type="submit" className="admin-btn-secondary min-h-[44px] px-3 text-xs">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {moreOpen ? (
          <nav className="mx-auto mt-3 grid max-w-3xl grid-cols-2 gap-2">
            {ADMIN_MORE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-navy/10 bg-white px-3 py-3 text-center text-sm font-semibold text-navy no-underline"
                onClick={() => setMoreOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className={`mx-auto ${mainMaxWidth} scroll-pt-20 px-4 pb-36 pt-4`}>{children}</main>

      {fabOpen ? (
        <div
          className="fixed inset-0 z-40 bg-navy/30 backdrop-blur-[2px] md:hidden"
          onClick={() => setFabOpen(false)}
          aria-hidden
        />
      ) : null}

      <div
        className={`fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 transition md:bottom-8 ${
          fabOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {fabOpen
          ? QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="pointer-events-auto flex min-h-[48px] items-center gap-2 rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm font-semibold text-navy shadow-lift no-underline"
                onClick={() => setFabOpen(false)}
              >
                <span aria-hidden>{action.icon}</span>
                {action.label}
              </Link>
            ))
          : null}
        <button
          type="button"
          onClick={() => setFabOpen((v) => !v)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-navy to-ocean text-2xl text-white shadow-lift ring-4 ring-white"
          aria-label={fabOpen ? "Close quick actions" : "Open quick actions"}
        >
          {fabOpen ? "×" : "+"}
        </button>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-cream/95 pb-safe backdrop-blur-md"
        aria-label="Admin navigation"
      >
        <div className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-2 py-2">
          {ADMIN_NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl text-[11px] font-semibold no-underline transition ${
                  active ? "bg-navy text-white shadow-md" : "text-navy hover:bg-sky/50"
                }`}
              >
                <span className="text-base" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </AdminToastProvider>
  );
}
