import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, Card } from "@/components/admin/ui";
import { SopDetail } from "@/components/admin/sop-detail";
import { getSopBySlug } from "@/lib/admin/queries";

export default async function SopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sop = await getSopBySlug(slug);
  if (!sop) notFound();

  return (
    <div>
      <AdminPageHeader
        title={sop.title}
        subtitle="Field checklist with supplies, QC, and photo standards."
        actions={
          <Link href="/admin/sops" className="btn-secondary no-underline">
            All SOPs
          </Link>
        }
      />
      <SopDetail sop={sop} />
    </div>
  );
}
