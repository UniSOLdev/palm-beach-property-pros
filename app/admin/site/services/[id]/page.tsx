import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { SiteServiceForm } from "@/components/admin/site-service-form";
import { getAdminService } from "@/lib/admin/actions/site-services";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminServiceEditPage({ params }: Props) {
  const { id } = await params;

  try {
    const { service, faqs } = await getAdminService(id);

    return (
      <div className="space-y-4">
        <Link href="/admin/site/services" className="text-sm font-semibold text-ocean no-underline hover:underline">
          ← Services
        </Link>
        <AdminPageHeader title={service.title} subtitle={`Edit /services/${service.slug}`} />
        <SiteServiceForm
          service={{
            id: service.id,
            slug: service.slug,
            title: service.title,
            short_description: service.short_description,
            headline: service.headline,
            authority_intro: service.authority_intro,
            best_for: service.best_for,
            included: service.included,
            add_ons: service.add_ons,
            who_its_for: service.who_its_for,
            process_steps: service.process_steps,
            pricing_mode: service.pricing_mode,
            pricing_label: service.pricing_label,
            cta_headline: service.cta_headline,
            cta_body: service.cta_body,
            cover_image_url: service.cover_image_url,
            cover_media_id: service.cover_media_id,
            water_access_note: service.water_access_note,
            seo_title: service.seo_title,
            seo_description: service.seo_description,
            display_order: service.display_order,
            is_featured: service.is_featured,
            is_active: service.is_active,
            faqs: [],
          }}
          faqs={faqs}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
