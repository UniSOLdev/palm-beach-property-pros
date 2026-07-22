import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { SiteHomepageForm } from "@/components/admin/site-homepage-form";
import { getAdminHomepageSettings } from "@/lib/admin/actions/site-homepage";
import { DEFAULT_HOMEPAGE } from "@/lib/site-content/queries";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const settings = (await getAdminHomepageSettings()) ?? DEFAULT_HOMEPAGE;

  return (
    <div className="space-y-4 pb-8">
      <Link href="/admin/site" className="text-sm font-semibold text-ocean no-underline hover:underline">
        ← Website CMS
      </Link>
      <AdminPageHeader
        title="Homepage Editor"
        subtitle="Controlled sections — not a free-form page builder"
      />
      <SiteHomepageForm settings={settings} />
    </div>
  );
}
