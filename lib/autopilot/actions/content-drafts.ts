"use server";

import { revalidatePath } from "next/cache";
import type { ContentDraftType } from "@/lib/autopilot/types";
import { createServiceClient } from "@/lib/supabase/service";

export type ContentDraftRow = {
  id: string;
  draft_key: string;
  draft_type: ContentDraftType;
  title: string;
  status: string;
  content: Record<string, unknown>;
  source_entity_type: string | null;
  source_entity_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function revalidateContentAutopilot() {
  revalidatePath("/admin/autopilot/content");
}

export async function listContentDrafts(options?: {
  status?: string | "all";
  limit?: number;
}): Promise<ContentDraftRow[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("content_drafts")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  } else if (!options?.status) {
    query = query.in("status", ["pending_review", "draft"]);
  }

  query = query.limit(options?.limit ?? 50);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ContentDraftRow[];
}

export async function approveContentDraft(id: string) {
  const supabase = createServiceClient();

  const { data: draft, error: fetchError } = await supabase
    .from("content_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!draft) throw new Error("Draft not found.");
  if (draft.status === "approved" || draft.status === "published") {
    return draft as ContentDraftRow;
  }

  const { data, error } = await supabase
    .from("content_drafts")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  // TODO: publish approved draft to website_pages / website_sections via site builder.
  // Map draft_type + content payload to the appropriate CMS publish path without auto-publishing on cron.

  revalidateContentAutopilot();
  return data as ContentDraftRow;
}

export async function rejectContentDraft(id: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("content_drafts")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  revalidateContentAutopilot();
  return data as ContentDraftRow;
}
