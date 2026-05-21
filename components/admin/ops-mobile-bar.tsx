"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Home" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/expenses/import", label: "Expense" },
  { href: "/admin/crew", label: "Crew" },
  { href: "/admin/invoices/new", label: "Invoice" },
] as const;

export function OpsMobileBar() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-navy/95 px-2 py-2 pb-safe shadow-[0_-12px_36px_rgba(10,14,20,0.28)] backdrop-blur-xl md:hidden"
      aria-label="Quick operations"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl px-1 text-[10px] font-semibold uppercase tracking-wide no-underline transition ${
                  active
                    ? "bg-aqua/20 text-cream ring-1 ring-aqua/40"
                    : "text-silver hover:bg-white/5 hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
