export const dynamic = "force-dynamic";

import { CmsHomepageEditor } from "@/components/admin/cms-homepage-editor";
import { createServiceSupabase } from "@/lib/supabase/service";

export const metadata = { title: "Homepage builder" };

export default async function HomepageBuilderPage() {
  let initialDraft = "[]";
  try {
    const supabase = createServiceSupabase();
    const { data } = await supabase.from("cms_homepage").select("draft_sections").eq("id", 1).maybeSingle();
    initialDraft = JSON.stringify(data?.draft_sections ?? [], null, 2);
  } catch {
    initialDraft = "[]";
  }

  return <CmsHomepageEditor initialDraft={initialDraft} />;
}
