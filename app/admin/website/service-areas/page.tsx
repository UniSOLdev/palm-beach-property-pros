import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";

export default function WebsiteServiceAreasPage() {
  return (
    <div>
      <AdminPageHeader title="Service areas" subtitle="City/area entries for localized marketing." />
      <Card>
        <p className="text-sm text-charcoal/75">
          Table <code className="rounded bg-ice px-1">website_service_areas</code> is created in migration 006. Populate from Supabase or
          add a simple editor here next.
        </p>
        <Link href="/service-area" className="mt-4 inline-block text-sm font-semibold text-ocean no-underline">
          View public service area page →
        </Link>
      </Card>
    </div>
  );
}
