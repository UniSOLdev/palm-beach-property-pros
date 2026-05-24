"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { PagePreview } from "@/components/cms/sections/section-renderer";
import { BuilderToolbar } from "@/components/admin/website-builder/builder-toolbar";
import { SeoPanel } from "@/components/admin/website-builder/seo-panel";
import { SectionEditorPanel } from "@/components/admin/website-builder/section-editor-panel";
import { ThemeEditorPanel } from "@/components/admin/website-builder/theme-editor-panel";
import { WebsiteHealthPanel } from "@/components/admin/website-builder/website-health-panel";
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
  seo: { slug: string; seo_title: string; meta_description: string; og_image_url: string };
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      className={`studio-section-row cursor-pointer ${selected ? "studio-section-row-active" : ""} ${!section.is_visible ? "opacity-50" : ""} ${isDragging ? "z-10 shadow-lift" : ""}`}
      onClick={onSelect}
      whileHover={{ scale: isDragging ? 1 : 1.01 }}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex min-h-[40px] min-w-[40px] shrink-0 cursor-grab items-center justify-center rounded-lg border border-navy/10 bg-cream/80 text-charcoal/50 active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
            <circle cx="4" cy="3" r="1.2" /><circle cx="10" cy="3" r="1.2" />
            <circle cx="4" cy="7" r="1.2" /><circle cx="10" cy="7" r="1.2" />
            <circle cx="4" cy="11" r="1.2" /><circle cx="10" cy="11" r="1.2" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">{section.label ?? SECTION_TYPE_LABELS[section.section_type]}</p>
          <p className="text-[11px] text-charcoal/55">{SECTION_TYPE_LABELS[section.section_type]}</p>
        </div>
        <div className="flex gap-1">
          <button type="button" disabled={pending} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-ocean hover:bg-sky/40" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            Copy
          </button>
          <button type="button" disabled={pending} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            Del
          </button>
        </div>
      </div>
    </motion.li>
  );
}

export function WebsiteBuilder({ bundle }: { bundle: BuilderPageBundle }) {
  const initial: BuilderState = {
    sections: bundle.sections,
    seo: {
      slug: bundle.page.slug,
      seo_title: bundle.page.seo_title ?? "",
      meta_description: bundle.page.meta_description ?? "",
      og_image_url: bundle.page.og_image_url ?? "",
    },
  };

  const { state, push, undo, redo, canUndo, canRedo, reset } = useBuilderHistory(initial);
  const [savedBaseline, setSavedBaseline] = useState(JSON.stringify(initial));
  const [selectedId, setSelectedId] = useState<string | null>(bundle.sections[0]?.id ?? null);
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [addType, setAddType] = useState<WebsiteSectionType>("hero");
  const [rollbackId, setRollbackId] = useState(bundle.publishVersions[0]?.id ?? "");
  const [leftTab, setLeftTab] = useState<"sections" | "seo" | "theme">("sections");

  const selected = state.sections.find((s) => s.id === selectedId) ?? null;
  const previewUrl = `/preview/${bundle.page.preview_token}`;
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(state) !== savedBaseline,
    [state, savedBaseline],
  );

  const debouncedSave = useDebouncedCallback(() => {
    performSave(false);
  }, 2500);

  useEffect(() => {
    if (JSON.stringify(state) === savedBaseline) return;
    debouncedSave();
  }, [state, debouncedSave, savedBaseline]);

  function performSave(manual: boolean) {
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
        setSavedBaseline(JSON.stringify(state));
        setSaveStatus("saved");
        if (manual) setError("");
      } catch (err) {
        setSaveStatus("error");
        setError(err instanceof Error ? err.message : "Autosave failed");
      }
    });
  }

  function performPublish() {
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
        setSavedBaseline(JSON.stringify(state));
        setSaveStatus("saved");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Publish failed");
      }
    });
  }

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
    <div className="flex min-h-[calc(100vh-6rem)] flex-col">
      <BuilderToolbar
        pageTitle={bundle.page.title}
        pageStatus={bundle.page.status}
        previewUrl={previewUrl}
        saveStatus={saveStatus}
        hasUnsavedChanges={hasUnsavedChanges}
        canUndo={canUndo}
        canRedo={canRedo}
        viewport={viewport}
        pending={pending}
        onUndo={undo}
        onRedo={redo}
        onSave={() => performSave(true)}
        onPublish={performPublish}
        onViewportChange={setViewport}
      />

      {error ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </motion.p>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-[400px] xl:w-[440px]">
          <div className="flex gap-1 rounded-xl bg-sky/30 p-1">
            {(["sections", "seo", "theme"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLeftTab(tab)}
                className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition ${
                  leftTab === tab ? "bg-white text-navy shadow-sm" : "text-charcoal/60 hover:text-navy"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {leftTab === "theme" ? (
            <ThemeEditorPanel
              initialTokens={bundle.theme as Record<string, string>}
              initialDarkMode={Boolean(bundle.theme.darkMode)}
            />
          ) : null}

          {leftTab === "seo" ? (
            <>
              <SeoPanel
                seo={state.seo}
                sectionCount={state.sections.length}
                onChange={(patch) => push({ ...state, seo: { ...state.seo, ...patch } })}
              />
              <WebsiteHealthPanel seo={state.seo} sections={state.sections} pageStatus={bundle.page.status} />
            </>
          ) : null}

          {leftTab === "sections" ? (
            <>
              <div className="studio-panel flex-1 overflow-hidden">
                <h3 className="font-bold text-navy">Sections</h3>
                <p className="mt-1 text-[11px] text-charcoal/55">Drag to reorder · click to edit</p>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={state.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <ul className="mt-3 max-h-[240px] space-y-2 overflow-y-auto sm:max-h-[320px]">
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
                      <option key={t} value={t}>{SECTION_TYPE_LABELS[t]}</option>
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

              {bundle.publishVersions.length > 0 ? (
                <div className="studio-panel flex gap-2">
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

              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="studio-panel max-h-[50vh] overflow-y-auto"
                  >
                    <SectionEditorPanel section={selected} onChange={updateSelectedContent} onMetaChange={updateSelectedMeta} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </>
          ) : null}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="studio-glass mb-3 flex items-center justify-between px-4 py-3">
            <p className="text-sm font-semibold text-navy">Live preview</p>
            <p className="text-[11px] text-charcoal/50">{VIEWPORT_WIDTHS[viewport] === "100%" ? "Full width" : VIEWPORT_WIDTHS[viewport]}</p>
          </div>
          <div className="flex justify-center overflow-hidden rounded-2xl border border-navy/10 bg-neutral-100/60 shadow-studio">
            <motion.div
              animate={{ width: VIEWPORT_WIDTHS[viewport] }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="min-h-[500px] overflow-y-auto bg-cream sm:min-h-[640px]"
              style={{ maxWidth: "100%" }}
            >
              <PagePreview
                sections={state.sections}
                theme={bundle.theme}
                selectedId={selectedId}
                onSelectSection={setSelectedId}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
