import "server-only";
import {
  generateHomepageSectionDraft,
  homepageSectionTypes,
} from "@/lib/autopilot/content/draft-generator";
import {
  scanJobProjectDrafts,
  scanTransformationProjectDrafts,
} from "@/lib/autopilot/content/project-drafts";
import { dailyRunKey } from "@/lib/autopilot/run-log";
import { runEngine } from "@/lib/autopilot/runner";
import type { EngineResult } from "@/lib/autopilot/types";
import { createServiceClient } from "@/lib/supabase/service";

export const CONTENT_ENGINE_JOB_KEY = "content_weekly";

const HOMEPAGE_STALE_DAYS = 30;

async function homepageRecentlyUpdated(): Promise<boolean> {
  const supabase = createServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HOMEPAGE_STALE_DAYS);
  const cutoffIso = cutoff.toISOString();

  const { data: recentDrafts } = await supabase
    .from("content_drafts")
    .select("id")
    .eq("draft_type", "homepage_section")
    .in("status", ["approved", "published", "scheduled"])
    .gte("updated_at", cutoffIso)
    .limit(1);

  if (recentDrafts?.length) return true;

  const { data: homePage } = await supabase
    .from("website_pages")
    .select("id")
    .eq("slug", "home")
    .maybeSingle();

  if (!homePage?.id) return false;

  const { data: recentRevision } = await supabase
    .from("website_revisions")
    .select("id")
    .eq("page_id", homePage.id)
    .gte("created_at", cutoffIso)
    .limit(1);

  return Boolean(recentRevision?.length);
}

async function createStaleHomepageDrafts() {
  const supabase = createServiceClient();
  const stale = !(await homepageRecentlyUpdated());
  if (!stale) return { created: 0, skipped: homepageSectionTypes().length, draftIds: [] as string[] };

  let created = 0;
  let skipped = 0;
  const draftIds: string[] = [];

  for (const sectionType of homepageSectionTypes()) {
    const draft = generateHomepageSectionDraft(sectionType);
    const { data, error } = await supabase
      .from("content_drafts")
      .insert({
        draft_key: draft.draft_key,
        draft_type: draft.draft_type,
        title: draft.title,
        status: "pending_review",
        content: draft.content,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        skipped += 1;
        continue;
      }
      throw new Error(error.message);
    }

    created += 1;
    draftIds.push(data.id);
  }

  return { created, skipped, draftIds };
}

export async function runContentEngine(): Promise<EngineResult> {
  const runKey = dailyRunKey();

  return runEngine(CONTENT_ENGINE_JOB_KEY, runKey, async () => {
    const errors: string[] = [];
    let created = 0;
    let skipped = 0;
    const details: Record<string, unknown> = {};

    try {
      const jobResult = await scanJobProjectDrafts({ lookbackDays: 7 });
      created += jobResult.created;
      skipped += jobResult.skipped;
      details.jobProjectDrafts = jobResult;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    try {
      const pairResult = await scanTransformationProjectDrafts({ lookbackDays: 7 });
      created += pairResult.created;
      skipped += pairResult.skipped;
      details.transformationDrafts = pairResult;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    try {
      const homepageResult = await createStaleHomepageDrafts();
      created += homepageResult.created;
      skipped += homepageResult.skipped;
      details.homepageDrafts = homepageResult;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    return {
      ok: errors.length === 0,
      jobKey: CONTENT_ENGINE_JOB_KEY,
      created,
      updated: 0,
      skipped,
      errors,
      details,
    };
  });
}
