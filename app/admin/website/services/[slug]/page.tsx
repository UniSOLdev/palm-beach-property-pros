export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { CmsServiceOverrideEditor } from "@/components/admin/cms-service-override-editor";
import { createServiceSupabase } from "@/lib/supabase/service";
import { getServiceBySlug } from "@/lib/services";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const s = getServiceBySlug(slug);
  if (!s) return { title: "Service" };
  return { title: `${s.name} · CMS overlay` };
}

export default async function AdminServiceCmsPage({ params }: Props) {
  const { slug } = await params;
  if (!getServiceBySlug(slug)) notFound();

  let initial = "{}";
  try {
    const supabase = createServiceSupabase();
    const { data } = await supabase.from("cms_service_overrides").select("draft").eq("slug", slug).maybeSingle();
    initial = JSON.stringify(data?.draft && typeof data.draft === "object" ? data.draft : {}, null, 2);
  } catch {
    initial = "{}";
  }

  return <CmsServiceOverrideEditor slug={slug} initialDraft={initial} />;
}
