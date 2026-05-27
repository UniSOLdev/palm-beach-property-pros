-- Track draft edits separately from publish state.
-- Prevents autosave from demoting published pages to draft.

BEGIN;

ALTER TABLE public.website_pages
  ADD COLUMN IF NOT EXISTS draft_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS has_unpublished_changes boolean NOT NULL DEFAULT false;

-- Backfill: published pages with recent section edits likely have unpublished changes
UPDATE public.website_pages p
SET draft_updated_at = COALESCE(p.updated_at, now())
WHERE p.draft_updated_at IS NULL;

COMMIT;
