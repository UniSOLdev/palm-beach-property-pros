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
import { AddSectionModal } from "@/components/builder/add-section-modal";
import { BuilderAIPalette } from "@/components/builder/builder-ai-palette";
import { LivePreviewPanel } from "@/components/builder/visual/live-preview-panel";
import { BuilderToolbar } from "@/components/admin/website-builder/builder-toolbar";
import { SeoPanel } from "@/components/admin/website-builder/seo-panel";
import { SectionEditorPanel } from "@/components/admin/website-builder/section-editor-panel";
import { ThemeEditorPanel } from "@/components/admin/website-builder/theme-editor-panel";
import { WebsiteHealthPanel } from "@/components/admin/website-builder/website-health-panel";
import {
  SECTION_TYPE_LABELS,
  type WebsiteSectionRow,
  type WebsiteSectionType,
} from "@/lib/cms/section-registry";
import type { BuilderPageBundle } from "@/lib/admin/actions/website-builder";
import {
  addWebsiteSection,
  deleteWebsiteSection,
  duplicateWebsiteSection,
  rollbackWebsitePage,
} from "@/lib/admin/actions/website-builder";
import { useBuilderAutosave } from "@/lib/stores/use-builder-autosave";
import {
  selectIsDirty,
  selectSelectedSection,
  useBuilderStore,
} from "@/lib/stores/use-builder-store";

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
  const hydrate = useBuilderStore((s) => s.hydrate);
  const resetStore = useBuilderStore((s) => s.resetStore);
  const sections = useBuilderStore((s) => s.sections);
  const seo = useBuilderStore((s) => s.seo);
  const theme = useBuilderStore((s) => s.theme);
  const pageTitle = useBuilderStore((s) => s.pageTitle);
  const pageStatus = useBuilderStore((s) => s.pageStatus);
  const hasUnpublishedChanges = useBuilderStore((s) => s.hasUnpublishedChanges);
  const previewToken = useBuilderStore((s) => s.previewToken);
  const pageId = useBuilderStore((s) => s.pageId);
  const publishVersions = useBuilderStore((s) => s.publishVersions);
  const selectedId = useBuilderStore((s) => s.selectedSectionId);
  const leftTab = useBuilderStore((s) => s.leftTab);
  const sidebarCollapsed = useBuilderStore((s) => s.sidebarCollapsed);
  const viewport = useBuilderStore((s) => s.viewport);
  const zoom = useBuilderStore((s) => s.zoom);
  const focusMode = useBuilderStore((s) => s.focusMode);
  const activeField = useBuilderStore((s) => s.activeField);
  const lockedIds = useBuilderStore((s) => s.lockedIds);
  const saveStatus = useBuilderStore((s) => s.saveStatus);
  const saveError = useBuilderStore((s) => s.saveError);
  const canUndo = useBuilderStore((s) => s.canUndo);
  const canRedo = useBuilderStore((s) => s.canRedo);
  const isDirty = useBuilderStore(selectIsDirty);
  const isSaving = useBuilderStore((s) => s.isSaving);
  const isPublishing = useBuilderStore((s) => s.isPublishing);
  const selected = useBuilderStore(selectSelectedSection);

  const reorderSections = useBuilderStore((s) => s.reorderSections);
  const selectSection = useBuilderStore((s) => s.selectSection);
  const setSeo = useBuilderStore((s) => s.setSeo);
  const setLeftTab = useBuilderStore((s) => s.setLeftTab);
  const toggleSidebar = useBuilderStore((s) => s.toggleSidebar);
  const setViewport = useBuilderStore((s) => s.setViewport);
  const setZoom = useBuilderStore((s) => s.setZoom);
  const toggleFocusMode = useBuilderStore((s) => s.toggleFocusMode);
  const setActiveField = useBuilderStore((s) => s.setActiveField);
  const patchSectionField = useBuilderStore((s) => s.patchSectionField);
  const updateSectionContent = useBuilderStore((s) => s.updateSectionContent);
  const updateSectionMeta = useBuilderStore((s) => s.updateSectionMeta);
  const addSectionRow = useBuilderStore((s) => s.addSectionRow);
  const removeSectionRow = useBuilderStore((s) => s.removeSectionRow);
  const resetHistory = useBuilderStore((s) => s.resetHistory);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const toggleSectionLock = useBuilderStore((s) => s.toggleSectionLock);
  const toggleSectionVisibility = useBuilderStore((s) => s.toggleSectionVisibility);

  const { saveNow, saveAndPreview, publish } = useBuilderAutosave();
  const [pending, startTransition] = useTransition();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [rollbackId, setRollbackId] = useState(bundle.publishVersions[0]?.id ?? "");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const previewUrl = `/preview/${previewToken}`;
  const busy = pending || isSaving || isPublishing;

  useEffect(() => {
    hydrate(bundle);
    setRollbackId(bundle.publishVersions[0]?.id ?? "");
    return () => resetStore();
  }, [bundle, hydrate, resetStore]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    reorderSections(arrayMove(sections, oldIndex, newIndex));
  }

  function handleDuplicateSection(id: string) {
    startTransition(async () => {
      try {
        const copy = await duplicateWebsiteSection(id, pageId);
        resetHistory({
          sections: [...sections, copy],
          seo,
          theme,
        });
        selectSection(copy.id);
      } catch (err) {
        useBuilderStore.getState().setSaveStatus("error", err instanceof Error ? err.message : "Duplicate failed");
      }
    });
  }

  function handleDeleteSection(id: string) {
    startTransition(async () => {
      try {
        await deleteWebsiteSection(id, pageId);
        removeSectionRow(id);
      } catch (err) {
        useBuilderStore.getState().setSaveStatus("error", err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  function handleInsertSection(type: WebsiteSectionType) {
    startTransition(async () => {
      try {
        const row = await addWebsiteSection(pageId, type);
        addSectionRow(row);
      } catch (err) {
        useBuilderStore.getState().setSaveStatus("error", err instanceof Error ? err.message : "Add failed");
      }
    });
  }

  async function handlePreview() {
    const url = await saveAndPreview();
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col">
      <BuilderToolbar
        pageTitle={pageTitle}
        pageStatus={pageStatus}
        hasUnpublishedChanges={hasUnpublishedChanges}
        previewUrl={previewUrl}
        saveStatus={saveStatus}
        hasUnsavedChanges={isDirty}
        canUndo={canUndo}
        canRedo={canRedo}
        viewport={viewport}
        pending={busy}
        onUndo={undo}
        onRedo={redo}
        onSave={() => void saveNow()}
        onPublish={() => startTransition(async () => { await publish(); })}
        onPreview={() => void handlePreview()}
        onViewportChange={setViewport}
        zoom={zoom}
        onZoomChange={setZoom}
        focusMode={focusMode}
        onToggleFocus={toggleFocusMode}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        onAddSection={() => setAddModalOpen(true)}
        onOpenAI={() => setAiOpen(true)}
      />

      {saveError ? (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </motion.p>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 lg:flex-row">
        <AnimatePresence initial={false}>
          {!sidebarCollapsed ? (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex w-full shrink-0 flex-col gap-3 overflow-hidden lg:w-[400px] xl:w-[440px]"
            >
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

              {leftTab === "theme" ? <ThemeEditorPanel /> : null}

              {leftTab === "seo" ? (
                <>
                  <SeoPanel seo={seo} sectionCount={sections.length} onChange={setSeo} />
                  <WebsiteHealthPanel seo={seo} sections={sections} pageStatus={pageStatus} />
                </>
              ) : null}

              {leftTab === "sections" ? (
                <>
                  <div className="studio-panel flex-1 overflow-hidden">
                    <h3 className="font-bold text-navy">Sections</h3>
                    <p className="mt-1 text-[11px] text-charcoal/55">Drag to reorder · click to edit</p>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                        <ul className="mt-3 max-h-[240px] space-y-2 overflow-y-auto sm:max-h-[320px]">
                          {sections.map((section) => (
                            <SortableSectionRow
                              key={section.id}
                              section={section}
                              selected={selectedId === section.id}
                              pending={busy}
                              onSelect={() => selectSection(section.id)}
                              onDuplicate={() => handleDuplicateSection(section.id)}
                              onDelete={() => handleDeleteSection(section.id)}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        className="admin-btn w-full shrink-0 text-xs"
                        onClick={() => setAddModalOpen(true)}
                      >
                        + Insert section
                      </button>
                    </div>
                  </div>

                  {publishVersions.length > 0 ? (
                    <div className="studio-panel flex gap-2">
                      <select className="admin-input flex-1 text-xs" value={rollbackId} onChange={(e) => setRollbackId(e.target.value)}>
                        {publishVersions.map((v) => (
                          <option key={v.id} value={v.id}>
                            v{v.version_number} — {new Date(v.created_at).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busy || !rollbackId}
                        className="admin-btn-secondary shrink-0 text-xs"
                        onClick={() =>
                          startTransition(async () => {
                            try {
                              await rollbackWebsitePage(pageId, rollbackId);
                              window.location.reload();
                            } catch (err) {
                              useBuilderStore.getState().setSaveStatus(
                                "error",
                                err instanceof Error ? err.message : "Rollback failed",
                              );
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
                        <SectionEditorPanel
                          section={selected}
                          onChange={updateSectionContent}
                          onMetaChange={(patch) => updateSectionMeta(selected.id, patch)}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </>
              ) : null}
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <LivePreviewPanel
          sections={sections}
          theme={theme}
          selectedId={selectedId}
          lockedIds={lockedIds}
          viewport={viewport}
          zoom={zoom}
          focusMode={focusMode}
          activeField={activeField}
          setActiveField={setActiveField}
          onPatchField={patchSectionField}
          onSelectSection={selectSection}
          onReorder={reorderSections}
          onDuplicate={handleDuplicateSection}
          onDelete={handleDeleteSection}
          onToggleVisibility={toggleSectionVisibility}
          onToggleLock={toggleSectionLock}
        />
      </div>

      <AddSectionModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onInsert={handleInsertSection} />
      <BuilderAIPalette
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        sectionType={selected?.section_type}
        pageTitle={pageTitle}
        onApplyText={(text) => {
          if (selectedId) patchSectionField(selectedId, "headline", text);
        }}
      />
    </div>
  );
}
