import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";

const LINKS = [
  {
    href: "/admin/site/homepage",
    title: "Homepage Editor",
    body: "Hero text, trust statements, featured services/projects, section visibility.",
  },
  {
    href: "/admin/site/services",
    title: "Service Manager",
    body: "Edit service pages, FAQs, pricing language, SEO, and display order.",
  },
  {
    href: "/admin/site/projects",
    title: "Project Manager",
    body: "Create case studies with before/during/after galleries and publish state.",
  },
  {
    href: "/admin/website/media",
    title: "Media Library",
    body: "Upload, tag, and optimize photos for services and projects.",
  },
  {
    href: "/admin/leads",
    title: "Leads Pipeline",
    body: "Review quote requests, photos, water access notes, and follow-up status.",
  },
];

export default function SiteCmsHubPage() {
  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        title="Website CMS"
        subtitle="Manage public site content without editing code"
      />

      <div className="grid gap-3">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="admin-card block no-underline transition hover:shadow-lift"
          >
            <h2 className="text-base font-bold text-navy">{item.title}</h2>
            <p className="mt-1 text-sm text-charcoal/75">{item.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
