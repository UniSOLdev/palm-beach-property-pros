"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  publishWebsitePage,
  saveDraftSections,
  saveWebsiteTheme,
} from "@/lib/admin/actions/website-builder";
import {
  selectBuilderSnapshot,
  selectIsDirty,
  useBuilderStore,
} from "@/lib/stores/use-builder-store";

const AUTOSAVE_DELAY_MS = 2500;

export function useBuilderAutosave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  const flushSave = useCallback(async (manual = false): Promise<boolean> => {
    const state = useBuilderStore.getState();
    if (!state.hydrated || !state.pageId) return true;
    if (!selectIsDirty(state) && !manual) return true;

    const generation = state.nextSaveGeneration();
    state.setIsSaving(true);
    state.setSaveStatus("saving");

    const snapshot = selectBuilderSnapshot(state);
    const savePromise = (async () => {
      try {
        await saveDraftSections(
          state.pageId,
          snapshot.sections.map((s, i) => ({
            id: s.id,
            section_type: s.section_type,
            label: s.label,
            sort_order: i,
            is_visible: s.is_visible,
            content: s.content,
          })),
          snapshot.seo,
        );

        await saveWebsiteTheme(snapshot.theme, Boolean(snapshot.theme.darkMode));

        const current = useBuilderStore.getState();
        if (current.saveGeneration === generation) {
          current.markSaved();
          current.setPageStatus(current.pageStatus, current.publishedAt, true);
        }
        if (manual) current.setSaveStatus("saved");
        return true;
      } catch (err) {
        const current = useBuilderStore.getState();
        if (current.saveGeneration === generation) {
          current.setSaveStatus("error", err instanceof Error ? err.message : "Save failed");
        }
        return false;
      } finally {
        const current = useBuilderStore.getState();
        if (current.saveGeneration === generation) {
          current.setIsSaving(false);
        }
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = savePromise;
    return savePromise;
  }, []);

  const scheduleAutosave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushSave(false);
    }, AUTOSAVE_DELAY_MS);
  }, [flushSave]);

  useEffect(() => {
    const unsubscribe = useBuilderStore.subscribe((state, prev) => {
      if (!state.hydrated) return;
      const dirtyNow = selectIsDirty(state);
      const dirtyBefore = selectIsDirty(prev);
      if (dirtyNow && dirtyNow !== dirtyBefore) {
        scheduleAutosave();
      }
    });
    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleAutosave]);

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (inFlightRef.current) await inFlightRef.current;
    return flushSave(true);
  }, [flushSave]);

  const saveAndPreview = useCallback(async (): Promise<string | null> => {
    const ok = await saveNow();
    if (!ok) return null;
    return `/preview/${useBuilderStore.getState().previewToken}`;
  }, [saveNow]);

  const publish = useCallback(async () => {
    const state = useBuilderStore.getState();
    state.setIsPublishing(true);
    state.setSaveStatus("saving");
    try {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (inFlightRef.current) await inFlightRef.current;

      const snapshot = selectBuilderSnapshot(state);
      await saveDraftSections(
        state.pageId,
        snapshot.sections.map((s, i) => ({
          id: s.id,
          section_type: s.section_type,
          label: s.label,
          sort_order: i,
          is_visible: s.is_visible,
          content: s.content,
        })),
        snapshot.seo,
      );
      await saveWebsiteTheme(snapshot.theme, Boolean(snapshot.theme.darkMode));

      const result = await publishWebsitePage(state.pageId);
      const current = useBuilderStore.getState();
      current.markSaved();
      current.setPageStatus("published", new Date().toISOString(), false);
      current.setSaveStatus("saved");
      return result;
    } catch (err) {
      useBuilderStore.getState().setSaveStatus(
        "error",
        err instanceof Error ? err.message : "Publish failed",
      );
      throw err;
    } finally {
      useBuilderStore.getState().setIsPublishing(false);
    }
  }, []);

  return { saveNow, saveAndPreview, publish };
}
