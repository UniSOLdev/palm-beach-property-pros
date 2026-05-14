import Link from "next/link";
import { AdminPageHeader, Card } from "@/components/admin/ui";

export default function WebsiteMediaPage() {
  return (
    <div>
      <AdminPageHeader title="Media library" subtitle="Reusable image URLs and metadata." />
      <Card>
        <p className="text-sm text-charcoal/75">
          Table <code className="rounded bg-ice px-1">website_media</code> is ready after migration 006. Use gallery for photo workflows
          tonight; central media picks can be wired next.
        </p>
        <Link href="/admin/website/gallery" className="mt-4 inline-block text-sm font-semibold text-ocean no-underline">
          Open gallery →
        </Link>
      </Card>
    </div>
  );
}
