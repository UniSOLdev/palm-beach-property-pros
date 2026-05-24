"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { PagePreview } from "@/components/cms/sections/section-renderer";
import { ThemeEditorPanel } from "@/components/admin/website-builder/theme-editor-panel";
import { SectionEditorPanel } from "@/components/admin/website-builder/section-editor-panel";
import { useBuilderHistory, useDebouncedCallback } from "@/components/admin/website-builder/use-builder-history";
import {
  SECTION_TYPE_LABELS,
  VIEWPORT_WIDTHS,
  WEBSITE_SECTION_TYPES,
  type ViewportMode,
  type WebsiteSectionRow,
  type WebsiteSectionType,
} from "@/lib/cms/section-registry";
import type { BuilderPageBundle } from "@/lib/admin/actions/website-builder";
import {
  addWebsiteSection,
  deleteWebsiteSection,
  duplicateWebsiteSection,
  publishWebsitePage,
  rollbackWebsitePage,
  saveDraftSections,
} from "@/lib/admin/actions/website-builder";

type BuilderState = {
  sections: WebsiteSectionRow[];
  seo: { seo_title: string; meta_description: string; og_image_url: string };
};

function SortableSectionRow({
  section,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
  pending,
}: {
  section: WebsiteSectionRow;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`admin-card cursor-pointer p-3 transition ${selected ? "ring-2 ring-ocean" : ""} ${!section.is_visible ? "opacity-50" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="min-h-[36px] min-w-[36px] shrink-0 rounded-lg border border-navy/15 text-sm"
          aria-label="Drag"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">{section.label ?? SECTION_TYPE_LABELS[section.section_type]}</p>
          <p className="text-xs text-charcoal/60">{SECTION_TYPE_LABELS[section.section_type]}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" disabled={pending} className="rounded-lg px-2 py-1 text-xs text-ocean" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            Copy
          </button>
          <button type="button" disabled={pending} className="rounded-lg px-2 py-1 text-xs text-red-700" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            Del
          </button>
        </div>
      </div>
    </li>
  );
}

export function WebsiteBuilder({ bundle }: { bundle: BuilderPageBundle }) {
  const initial: BuilderState = {
    sections: bundle.sections,
    seo: {
      seo_title: bundle.page.seo_title ?? "",
      meta_description: bundle.page.meta_description ?? "",
      og_image_url: bundle.page.og_image_url ?? "",
    },
  };

  const { state, push, undo, redo, canUndo, canRedo, reset } = useBuilderHistory(initial);
  const [selectedId, setSelectedId] = useState<string | null>(bundle.sections[0]?.id ?? null);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [addType, setAddType] = useState<WebsiteSectionType>("hero");
  const [rollbackId, setRollbackId] = useState(bundle.publishVersions[0]?.id ?? "");

  const selected = state.sections.find((s) => s.id === selectedId) ?? null;
  const previewUrl = `/preview/${bundle.page.preview_token}`;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const debouncedSave = useDebouncedCallback(() => {
    startTransition(async () => {
      setSaveStatus("saving");
      try {
        await saveDraftSections(
          bundle.page.id,
          state.sections.map((s, i) => ({
            id: s.id,
            section_type: s.section_type,
            label: s.label,
            sort_order: i,
            is_visible: s.is_visible,
            content: s.content,
          })),
          state.seo,
        );
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("error");
        setError(err instanceof Error ? err.message : "Autosave failed");
      }
    });
  }, 2500);

  useEffect(() => {
    debouncedSave();
  }, [state, debouncedSave]);

  function updateSections(updater: (sections: WebsiteSectionRow[]) => WebsiteSectionRow[]) {
    push({ ...state, sections: updater(state.sections) });
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = state.sections.findIndex((s) => s.id === active.id);
    const newIndex = state.sections.findIndex((s) => s.id === over.id);
    push({ ...state, sections: arrayMove(state.sections, oldIndex, newIndex) });
  }

  function updateSelectedContent(content: Record<string, unknown>) {
    if (!selectedId) return;
    updateSections((sections) =>
      sections.map((s) => (s.id === selectedId ? { ...s, content } : s)),
    );
  }

  function updateSelectedMeta(patch: Partial<Pick<WebsiteSectionRow, "label" | "is_visible">>) {
    if (!selectedId) return;
    updateSections((sections) =>
      sections.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)),
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      {/* Left panel — controls */}
      <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[380px] xl:w-[420px]">
        {/* Toolbar */}
        <div className="admin-card sticky top-2 z-10 space-y-3 bg-white/95 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/website/pages" className="admin-btn-secondary text-xs no-underline">
              ← Pages
            </Link>
            <button type="button" disabled={!canUndo} onClick={undo} className="admin-btn-secondary px-3 text-xs">
              Undo
            </button>
            <button type="button" disabled={!canRedo} onClick={redo} className="admin-btn-secondary px-3 text-xs">
              Redo
            </button>
            <span className="ml-auto text-xs text-charcoal/60">
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Draft saved" : saveStatus === "error" ? "Save error" : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className="admin-btn flex-1 text-xs"
              onClick={() =>
                startTransition(async () => {
                  setError("");
                  try {
                    await saveDraftSections(
                      bundle.page.id,
                      state.sections.map((s, i) => ({
                        id: s.id,
                        section_type: s.section_type,
                        label: s.label,
                        sort_order: i,
                        is_visible: s.is_visible,
                        content: s.content,
                      })),
                      state.seo,
                    );
                    setSaveStatus("saved");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Save failed");
                  }
                })
              }
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={pending}
              className="admin-btn flex-1 bg-ocean text-xs"
              onClick={() =>
                startTransition(async () => {
                  setError("");
                  try {
                    await saveDraftSections(
                      bundle.page.id,
                      state.sections.map((s, i) => ({
                        id: s.id,
                        section_type: s.section_type,
                        label: s.label,
                        sort_order: i,
                        is_visible: s.is_visible,
                        content: s.content,
                      })),
                      state.seo,
                    );
                    await publishWebsitePage(bundle.page.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Publish failed");
                  }
                })
              }
            >
              Publish
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a href={previewUrl} target="_blank" rel="noreferrer" className="admin-btn-secondary flex-1 text-center text-xs no-underline">
              Preview draft
            </a>
            <span className={`admin-chip ${bundle.page.status === "published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-900"}`}>
              {bundle.page.status}
            </span>
          </div>
          {bundle.publishVersions.length > 0 ? (
            <div className="flex gap-2">
              <select className="admin-input flex-1 text-xs" value={rollbackId} onChange={(e) => setRollbackId(e.target.value)}>
                {bundle.publishVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.version_number} — {new Date(v.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending || !rollbackId}
                className="admin-btn-secondary shrink-0 text-xs"
                onClick={() =>
                  startTransition(async () => {
                    setError("");
                    try {
                      await rollbackWebsitePage(bundle.page.id, rollbackId);
                      window.location.reload();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Rollback failed");
                    }
                  })
                }
              >
                Restore
              </button>
            </div>
          ) : null}
        </div>

        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        {/* Theme */}
        <ThemeEditorPanel
          initialTokens={bundle.theme as Record<string, string>}
          initialDarkMode={Boolean(bundle.theme.darkMode)}
        />

        {/* SEO */}
        <details className="admin-card">
          <summary className="cursor-pointer font-semibold text-navy">Page SEO</summary>
          <div className="mt-3 space-y-2">
            <label className="block text-xs font-medium text-navy">
              SEO title
              <input
                className="admin-input text-sm"
                value={state.seo.seo_title}
                onChange={(e) => push({ ...state, seo: { ...state.seo, seo_title: e.target.value } })}
              />
            </label>
            <label className="block text-xs font-medium text-navy">
              Meta description
              <textarea
                className="admin-input min-h-[72px] text-sm"
                value={state.seo.meta_description}
                onChange={(e) => push({ ...state, seo: { ...state.seo, meta_description: e.target.value } })}
              />
            </label>
            <label className="block text-xs font-medium text-navy">
              OG image URL
              <input
                className="admin-input text-sm"
                value={state.seo.og_image_url}
                onChange={(e) => push({ ...state, seo: { ...state.seo, og_image_url: e.target.value } })}
              />
            </label>
            <p className="text-xs text-charcoal/60">Slug: /{bundle.page.slug === "home" ? "" : bundle.page.slug}</p>
          </div>
        </details>

        {/* Section list */}
        <div className="admin-card flex-1 overflow-hidden">
          <h3 className="font-bold text-navy">Sections</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={state.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <ul className="mt-3 max-h-[280px] space-y-2 overflow-y-auto">
                {state.sections.map((section) => (
                  <SortableSectionRow
                    key={section.id}
                    section={section}
                    selected={selectedId === section.id}
                    pending={pending}
                    onSelect={() => setSelectedId(section.id)}
                    onDuplicate={() =>
                      startTransition(async () => {
                        try {
                          const copy = await duplicateWebsiteSection(section.id, bundle.page.id);
                          reset({ ...state, sections: [...state.sections, copy] });
                          setSelectedId(copy.id);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Duplicate failed");
                        }
                      })
                    }
                    onDelete={() =>
                      startTransition(async () => {
                        try {
                          await deleteWebsiteSection(section.id, bundle.page.id);
                          const next = state.sections.filter((s) => s.id !== section.id);
                          push({ ...state, sections: next });
                          setSelectedId(next[0]?.id ?? null);
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Delete failed");
                        }
                      })
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <div className="mt-3 flex gap-2">
            <select className="admin-input flex-1 text-sm" value={addType} onChange={(e) => setAddType(e.target.value as WebsiteSectionType)}>
              {WEBSITE_SECTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SECTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending}
              className="admin-btn shrink-0 text-xs"
              onClick={() =>
                startTransition(async () => {
                  try {
                    const row = await addWebsiteSection(bundle.page.id, addType);
                    push({ ...state, sections: [...state.sections, row] });
                    setSelectedId(row.id);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Add failed");
                  }
                })
              }
            >
              + Add
            </button>
          </div>
        </div>

        {/* Section editor */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="admin-card max-h-[50vh] overflow-y-auto"
            >
              <SectionEditorPanel section={selected} onChange={updateSelectedContent} onMetaChange={updateSelectedMeta} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </aside>

      {/* Right panel — live preview */}
      <div className="min-w-0 flex-1">
        <div className="admin-card sticky top-2 z-10 mb-3 flex items-center justify-between bg-white/95 backdrop-blur-md">
          <p className="text-sm font-semibold text-navy">Live preview — {bundle.page.title}</p>
          <div className="flex gap-1">
            {(["desktop", "tablet", "mobile"] as ViewportMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewport(mode)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${viewport === mode ? "bg-navy text-white" : "bg-sky/40 text-navy"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-center overflow-hidden rounded-2xl border border-navy/10 bg-neutral-100/80 shadow-card">
          <motion.div
            animate={{ width: VIEWPORT_WIDTHS[viewport] }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="min-h-[600px] overflow-y-auto bg-cream"
            style={{ maxWidth: "100%" }}
          >
            <PagePreview sections={state.sections} theme={bundle.theme} selectedId={selectedId} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
