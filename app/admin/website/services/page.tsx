import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";

export default function WebsiteServicesAdminPage() {
  return (
    <div>
      <AdminPageHeader title="Marketing services" subtitle="Optional overrides for the public services experience." />
      <Card>
        <p className="text-sm text-charcoal/75">
          Table <code className="rounded bg-ice px-1">website_services</code> is ready after migration 006. For now the site uses{" "}
          <code className="rounded bg-ice px-1">lib/services.ts</code>. Add rows in Supabase to switch marketing pages to CMS-driven
          services in a follow-up.
        </p>
        <Link href="/admin/website" className="mt-4 inline-block text-sm font-semibold text-ocean no-underline">
          ← Website overview
        </Link>
      </Card>
    </div>
  );
}
