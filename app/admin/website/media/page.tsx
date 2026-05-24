import { MediaLibraryPro } from "@/components/admin/media-library-pro";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { listMediaAssets } from "@/lib/admin/actions/media-library";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media Library" };

export default async function MediaLibraryPage() {
  const supabase = await createClient();
  const { data: folders } = await supabase.from("media_folders").select("*").order("sort_order");

  let assets: Awaited<ReturnType<typeof listMediaAssets>> = [];
  try {
    assets = await listMediaAssets({ sort: "newest", limit: 120 });
  } catch {
    const { data } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false }).limit(60);
    assets = (data ?? []) as Awaited<ReturnType<typeof listMediaAssets>>;
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Media library"
        subtitle="Professional asset manager — bulk upload, metadata, before/after pairing, search"
      />
      <MediaLibraryPro folders={folders ?? []} initialAssets={assets} />
    </div>
  );
}
