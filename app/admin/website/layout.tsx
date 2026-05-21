import Link from "next/link";

const links = [
  { href: "/admin/website", label: "Dashboard" },
  { href: "/admin/website/homepage", label: "Homepage" },
  { href: "/admin/website/preview", label: "Draft preview" },
  { href: "/admin/website/media", label: "Media library" },
  { href: "/admin/website/gallery", label: "Gallery" },
  { href: "/admin/website/projects", label: "Projects" },
  { href: "/admin/website/reviews", label: "Reviews" },
  { href: "/admin/website/service-areas", label: "Service areas" },
  { href: "/admin/website/services", label: "Services" },
  { href: "/admin/website/ctas", label: "CTAs" },
  { href: "/admin/website/navigation", label: "Navigation & footer" },
  { href: "/admin/website/seo", label: "SEO" },
  { href: "/admin/website/theme", label: "Theme" },
] as const;

export default function WebsiteManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-page">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-400/90">Website manager</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">PBPP marketing CMS</h1>
        <p className="mt-1 text-sm text-zinc-500">
          No-code control center for homepage, media, SEO, navigation, and service content — publish when ready.
        </p>
      </div>
      <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-200 no-underline transition hover:border-sky-400/35 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
