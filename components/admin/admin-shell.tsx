"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "◆" },
  { href: "/admin/jobs", label: "Jobs", icon: "▣" },
  { href: "/admin/quotes", label: "Quotes", icon: "◇" },
  { href: "/admin/invoices", label: "Invoices", icon: "▤" },
  { href: "/admin/clients", label: "Clients", icon: "◎" },
  { href: "/admin/expenses", label: "Expenses", icon: "▥" },
  { href: "/admin/sops", label: "SOPs", icon: "☑" },
  { href: "/admin/supplies", label: "Supplies", icon: "▦" },
  { href: "/admin/crew", label: "Crew", icon: "☺" },
  { href: "/admin/reports", label: "Reports", icon: "▧" },
  { href: "/admin/website", label: "Website", icon: "◈" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const NavLinks = (
    <nav className="flex flex-1 flex-col gap-0.5 p-3">
      {nav.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition ${
              active
                ? "bg-coast/25 text-white ring-1 ring-coast/50 shadow-inner"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="w-5 text-center text-base opacity-90" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
      <div className="mt-4 border-t border-white/10 pt-4">
        <Link
          href="/"
          className="block rounded-xl px-3 py-2 text-sm font-medium text-white/70 no-underline hover:bg-white/10 hover:text-white"
          onClick={() => setOpen(false)}
        >
          ← Back to website
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-ice text-charcoal">
      <div className="lg:flex">
        <aside className="hidden w-64 shrink-0 flex-col bg-gradient-to-b from-navy via-navy to-ocean print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:border-r lg:border-white/10">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/95">Operations</div>
            <div className="mt-1 text-lg font-bold text-white">PBPP Command</div>
            <div className="text-xs text-white/65">Palm Beach Property Pros</div>
          </div>
          {NavLinks}
        </aside>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-sm print:hidden lg:hidden"
            role="presentation"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform bg-gradient-to-b from-navy to-ocean shadow-2xl transition-transform duration-200 print:hidden lg:hidden ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/95">Menu</div>
              <div className="text-base font-bold text-white">PBPP</div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          {NavLinks}
        </div>

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-navy/10 bg-white/95 backdrop-blur print:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-xl border border-navy/15 bg-ice text-navy lg:hidden"
                  aria-label="Open menu"
                  onClick={() => setOpen(true)}
                >
                  <span className="text-xl leading-none">≡</span>
                </button>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-ocean/90">
                    Field service dashboard
                  </div>
                  <div className="text-sm font-semibold text-navy md:text-base">Palm Beach Property Pros</div>
                </div>
              </div>
              <div className="hidden items-center gap-2 text-xs text-charcoal/70 sm:flex">
                <span className="rounded-full border border-leaf/30 bg-leaf/15 px-3 py-1 font-semibold text-navy">PBPP ops</span>
                <span className="rounded-full border border-navy/10 bg-ice px-3 py-1 text-charcoal/80">Mobile-ready</span>
              </div>
            </div>
          </header>
          <div className="border-t border-transparent bg-gradient-to-b from-ice to-sand/30 px-4 py-6 md:px-8 md:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
