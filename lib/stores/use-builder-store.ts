"use client";

import { create } from "zustand";
import { patchSectionContent } from "@/lib/builder/content-path";
import type { BuilderPageBundle } from "@/lib/admin/actions/website-builder";
import type { ViewportMode, WebsiteSectionRow } from "@/lib/cms/section-registry";

const MAX_HISTORY = 50;

export type BuilderSeo = {
  slug: string;
  seo_title: string;
  meta_description: string;
  og_image_url: string;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type ContentSnapshot = {
  sections: WebsiteSectionRow[];
  seo: BuilderSeo;
  theme: Record<string, unknown>;
};

export function serializeBuilderSnapshot(snapshot: ContentSnapshot): string {
  return JSON.stringify(snapshot);
}

function snapshotFromBundle(bundle: BuilderPageBundle): ContentSnapshot {
  return {
    sections: bundle.sections,
    seo: {
      slug: bundle.page.slug,
      seo_title: bundle.page.seo_title ?? "",
      meta_description: bundle.page.meta_description ?? "",
      og_image_url: bundle.page.og_image_url ?? "",
    },
    theme: { ...bundle.theme },
  };
}

type BuilderStore = ContentSnapshot & {
  pageId: string;
  previewToken: string;
  pageTitle: string;
  pageStatus: string;
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  publishVersions: BuilderPageBundle["publishVersions"];
  hydrated: boolean;

  selectedSectionId: string | null;
  viewport: ViewportMode;
  zoom: number;
  focusMode: boolean;
  leftTab: "sections" | "seo" | "theme";
  sidebarCollapsed: boolean;
  activeField: string | null;
  lockedIds: Set<string>;

  saveStatus: SaveStatus;
  saveError: string;
  savedBaseline: string;
  saveGeneration: number;
  isSaving: boolean;
  isPublishing: boolean;

  historyPast: ContentSnapshot[];
  historyFuture: ContentSnapshot[];
  canUndo: boolean;
  canRedo: boolean;

  hydrate: (bundle: BuilderPageBundle) => void;
  resetStore: () => void;

  pushHistory: (next: ContentSnapshot) => void;
  undo: () => void;
  redo: () => void;
  resetHistory: (next: ContentSnapshot) => void;

  setSections: (sections: WebsiteSectionRow[]) => void;
  reorderSections: (sections: WebsiteSectionRow[]) => void;
  updateSectionMeta: (id: string, patch: Partial<Pick<WebsiteSectionRow, "label" | "is_visible">>) => void;
  updateSectionContent: (content: Record<string, unknown>) => void;
  patchSectionField: (sectionId: string, path: string, value: unknown) => void;
  addSectionRow: (section: WebsiteSectionRow) => void;
  removeSectionRow: (id: string) => void;

  setSeo: (patch: Partial<BuilderSeo>) => void;
  setTheme: (theme: Record<string, unknown>) => void;
  patchTheme: (patch: Record<string, unknown>) => void;

  selectSection: (id: string | null) => void;
  setViewport: (viewport: ViewportMode) => void;
  setZoom: (zoom: number) => void;
  toggleFocusMode: () => void;
  setLeftTab: (tab: "sections" | "seo" | "theme") => void;
  toggleSidebar: () => void;
  setActiveField: (field: string | null) => void;
  toggleSectionLock: (id: string) => void;
  toggleSectionVisibility: (id: string) => void;

  setSaveStatus: (status: SaveStatus, error?: string) => void;
  setIsSaving: (saving: boolean) => void;
  setIsPublishing: (publishing: boolean) => void;
  markSaved: () => void;
  nextSaveGeneration: () => number;
  setPageStatus: (status: string, publishedAt?: string | null, hasUnpublishedChanges?: boolean) => void;
};

const INITIAL_UI = {
  selectedSectionId: null as string | null,
  viewport: "desktop" as ViewportMode,
  zoom: 100,
  focusMode: false,
  leftTab: "sections" as const,
  sidebarCollapsed: false,
  activeField: null as string | null,
  lockedIds: new Set<string>(),
};

const EMPTY_SNAPSHOT: ContentSnapshot = {
  sections: [],
  seo: { slug: "", seo_title: "", meta_description: "", og_image_url: "" },
  theme: {},
};

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  ...EMPTY_SNAPSHOT,
  pageId: "",
  previewToken: "",
  pageTitle: "",
  pageStatus: "draft",
  hasUnpublishedChanges: false,
  publishedAt: null,
  publishVersions: [],
  hydrated: false,
  ...INITIAL_UI,
  saveStatus: "idle",
  saveError: "",
  savedBaseline: serializeBuilderSnapshot(EMPTY_SNAPSHOT),
  saveGeneration: 0,
  isSaving: false,
  isPublishing: false,
  historyPast: [],
  historyFuture: [],
  canUndo: false,
  canRedo: false,

  hydrate(bundle) {
    const snapshot = snapshotFromBundle(bundle);
    const baseline = serializeBuilderSnapshot(snapshot);
    set({
      ...snapshot,
      pageId: bundle.page.id,
      previewToken: bundle.page.preview_token,
      pageTitle: bundle.page.title,
      pageStatus: bundle.page.status,
      hasUnpublishedChanges: bundle.page.has_unpublished_changes ?? false,
      publishedAt: bundle.page.published_at,
      publishVersions: bundle.publishVersions,
      selectedSectionId: bundle.sections[0]?.id ?? null,
      hydrated: true,
      savedBaseline: baseline,
      saveStatus: "saved",
      saveError: "",
      saveGeneration: 0,
      isSaving: false,
      isPublishing: false,
      historyPast: [],
      historyFuture: [],
      canUndo: false,
      canRedo: false,
      activeField: null,
      lockedIds: new Set(),
    });
  },

  resetStore() {
    set({
      ...EMPTY_SNAPSHOT,
      pageId: "",
      previewToken: "",
      pageTitle: "",
      pageStatus: "draft",
      hasUnpublishedChanges: false,
      publishedAt: null,
      publishVersions: [],
      hydrated: false,
      ...INITIAL_UI,
      saveStatus: "idle",
      saveError: "",
      savedBaseline: serializeBuilderSnapshot(EMPTY_SNAPSHOT),
      saveGeneration: 0,
      isSaving: false,
      isPublishing: false,
      historyPast: [],
      historyFuture: [],
      canUndo: false,
      canRedo: false,
    });
  },

  pushHistory(next) {
    const { sections, seo, theme, historyPast } = get();
    const present = { sections, seo, theme };
    set({
      ...next,
      historyPast: [...historyPast.slice(-MAX_HISTORY + 1), present],
      historyFuture: [],
      canUndo: true,
      canRedo: false,
    });
  },

  undo() {
    const { historyPast, sections, seo, theme, historyFuture } = get();
    if (!historyPast.length) return;
    const previous = historyPast[historyPast.length - 1];
    const present = { sections, seo, theme };
    set({
      ...previous,
      historyPast: historyPast.slice(0, -1),
      historyFuture: [present, ...historyFuture],
      canUndo: historyPast.length > 1,
      canRedo: true,
    });
  },

  redo() {
    const { historyFuture, sections, seo, theme, historyPast } = get();
    if (!historyFuture.length) return;
    const next = historyFuture[0];
    const present = { sections, seo, theme };
    set({
      ...next,
      historyPast: [...historyPast, present],
      historyFuture: historyFuture.slice(1),
      canUndo: true,
      canRedo: historyFuture.length > 1,
    });
  },

  resetHistory(next) {
    set({
      ...next,
      historyPast: [],
      historyFuture: [],
      canUndo: false,
      canRedo: false,
    });
  },

  setSections(sections) {
    const { seo, theme } = get();
    get().pushHistory({ sections, seo, theme });
  },

  reorderSections(sections) {
    get().setSections(sections);
  },

  updateSectionMeta(id, patch) {
    const { sections, seo, theme } = get();
    get().pushHistory({
      sections: sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      seo,
      theme,
    });
  },

  updateSectionContent(content) {
    const { selectedSectionId, sections, seo, theme } = get();
    if (!selectedSectionId) return;
    get().pushHistory({
      sections: sections.map((s) => (s.id === selectedSectionId ? { ...s, content } : s)),
      seo,
      theme,
    });
  },

  patchSectionField(sectionId, path, value) {
    const { sections, seo, theme, selectedSectionId } = get();
    get().pushHistory({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, content: patchSectionContent(s.content, path, value) } : s,
      ),
      seo,
      theme,
    });
    if (selectedSectionId !== sectionId) {
      set({ selectedSectionId: sectionId });
    }
  },

  addSectionRow(section) {
    const { sections, seo, theme } = get();
    get().resetHistory({ sections: [...sections, section], seo, theme });
    set({ selectedSectionId: section.id });
  },

  removeSectionRow(id) {
    const { sections, seo, theme } = get();
    const next = sections.filter((s) => s.id !== id);
    get().pushHistory({ sections: next, seo, theme });
    set({ selectedSectionId: next[0]?.id ?? null });
  },

  setSeo(patch) {
    const { sections, seo, theme } = get();
    get().pushHistory({ sections, seo: { ...seo, ...patch }, theme });
  },

  setTheme(theme) {
    const { sections, seo } = get();
    get().pushHistory({ sections, seo, theme: { ...theme } });
  },

  patchTheme(patch) {
    const { sections, seo, theme } = get();
    get().pushHistory({ sections, seo, theme: { ...theme, ...patch } });
  },

  selectSection: (id) => set({ selectedSectionId: id }),
  setViewport: (viewport) => set({ viewport }),
  setZoom: (zoom) => set({ zoom }),
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setLeftTab: (leftTab) => set({ leftTab }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActiveField: (activeField) => set({ activeField }),

  toggleSectionLock(id) {
    set((s) => {
      const next = new Set(s.lockedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { lockedIds: next };
    });
  },

  toggleSectionVisibility(id) {
    const section = get().sections.find((s) => s.id === id);
    if (!section) return;
    get().updateSectionMeta(id, { is_visible: !section.is_visible });
  },

  setSaveStatus(saveStatus, saveError = "") {
    set({ saveStatus, saveError });
  },

  setIsSaving(isSaving) {
    set({ isSaving });
  },

  setIsPublishing(isPublishing) {
    set({ isPublishing });
  },

  markSaved() {
    const { sections, seo, theme } = get();
    set({
      savedBaseline: serializeBuilderSnapshot({ sections, seo, theme }),
      saveStatus: "saved",
      saveError: "",
    });
  },

  nextSaveGeneration() {
    const next = get().saveGeneration + 1;
    set({ saveGeneration: next });
    return next;
  },

  setPageStatus(pageStatus, publishedAt, hasUnpublishedChanges) {
    set({
      pageStatus,
      publishedAt: publishedAt !== undefined ? publishedAt : get().publishedAt,
      hasUnpublishedChanges:
        hasUnpublishedChanges !== undefined ? hasUnpublishedChanges : get().hasUnpublishedChanges,
    });
  },
}));

export function selectBuilderSnapshot(state: BuilderStore): ContentSnapshot {
  return { sections: state.sections, seo: state.seo, theme: state.theme };
}

export function selectIsDirty(state: BuilderStore): boolean {
  return serializeBuilderSnapshot(selectBuilderSnapshot(state)) !== state.savedBaseline;
}

export function selectSelectedSection(state: BuilderStore): WebsiteSectionRow | null {
  return state.sections.find((s) => s.id === state.selectedSectionId) ?? null;
}
