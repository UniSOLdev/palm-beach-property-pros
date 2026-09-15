import { ContentAutopilotPanel } from "@/components/admin/content-autopilot-panel";
import { listContentDrafts } from "@/lib/autopilot/actions/content-drafts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Content Autopilot" };

export default async function ContentAutopilotPage() {
  let drafts: Awaited<ReturnType<typeof listContentDrafts>> = [];
  let loadError = "";

  try {
    drafts = await listContentDrafts({ status: "all", limit: 100 });
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load content drafts";
  }

  return (
    <div className="space-y-4">
      {loadError ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          {" — "}
          Run the autopilot foundation migration on Supabase if the content_drafts table is missing.
        </p>
      ) : null}
      <ContentAutopilotPanel initialDrafts={drafts} />
    </div>
  );
}
