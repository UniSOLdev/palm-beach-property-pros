import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { ServiceAreaManager } from "@/components/admin/service-area-manager";
import { listServiceAreas } from "@/lib/admin/actions/service-areas";

export const dynamic = "force-dynamic";

export default async function ServiceAreasAdminPage() {
  const areas = await listServiceAreas().catch(() => []);

  return (
    <div className="space-y-4 pb-8">
      <Link href="/admin/site" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← Website CMS
      </Link>
      <AdminPageHeader title="Service Areas" subtitle="Cities, counties, and SEO landing pages" />
      <ServiceAreaManager initialAreas={areas} />
    </div>
  );
}
