import { MediaLibrary } from "@/components/admin/media-library";
import { AdminPageHeader } from "@/components/admin/entity-list";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media Library" };

export default async function MediaLibraryPage() {
  const supabase = await createClient();
  const [{ data: folders }, { data: assets }] = await Promise.all([
    supabase.from("media_folders").select("*").order("sort_order"),
    supabase.from("media_assets").select("*").order("sort_order").limit(60),
  ]);

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Media library" subtitle="Folders, uploads, before/after groups" />
      <MediaLibrary folders={folders ?? []} initialAssets={assets ?? []} />
    </div>
  );
}
