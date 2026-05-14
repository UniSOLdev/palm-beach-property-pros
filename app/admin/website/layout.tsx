import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/admin/website", label: "Overview" },
  { href: "/admin/website/gallery", label: "Gallery" },
  { href: "/admin/website/projects", label: "Projects" },
  { href: "/admin/website/reviews", label: "Reviews" },
  { href: "/admin/website/homepage", label: "Homepage" },
  { href: "/admin/website/services", label: "Services" },
  { href: "/admin/website/service-areas", label: "Service areas" },
  { href: "/admin/website/media", label: "Media" },
] as const;

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-navy/10 bg-white p-2 shadow-card">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-navy no-underline transition hover:bg-ice"
          >
            {l.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
