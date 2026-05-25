"use client";

import { useMemo, useState, useLayoutEffect } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { SortableCanvasSection } from "@/components/builder/visual/sortable-section";
import { FloatingToolbar } from "@/components/builder/editable/floating-toolbar";
import { mergeThemeConfig, themeConfigToCss } from "@/lib/builder/theme-config";
import { VIEWPORT_WIDTHS, type ViewportMode, type WebsiteSectionRow } from "@/lib/cms/section-registry";

type Props = {
  sections: WebsiteSectionRow[];
  theme?: Record<string, unknown>;
  selectedId: string | null;
  lockedIds: Set<string>;
  viewport: ViewportMode;
  zoom: number;
  focusMode: boolean;
  activeField: string | null;
  setActiveField: (field: string | null) => void;
  onPatchField: (sectionId: string, path: string, value: unknown) => void;
  onSelectSection: (id: string) => void;
  onReorder: (sections: WebsiteSectionRow[]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
};

export function LivePreviewPanel({
  sections,
  theme,
  selectedId,
  lockedIds,
  viewport,
  zoom,
  focusMode,
  activeField,
  setActiveField,
  onPatchField,
  onSelectSection,
  onReorder,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
}: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!activeField) {
      setToolbarPos(null);
      return;
    }
    const el = document.querySelector(`[data-editable-field="${activeField}"]`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setToolbarPos({ top: rect.top, left: rect.left + rect.width / 2 });
  }, [activeField]);

  const wrapperStyle = useMemo(
    () => themeConfigToCss(mergeThemeConfig(theme ?? {})),
    [theme],
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...sections];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onReorder(next);
  }

  const selectedSection = sections.find((s) => s.id === selectedId);

  return (
    <div className={`flex min-w-0 flex-1 flex-col ${focusMode ? "fixed inset-0 z-50 bg-charcoal/95 p-4 pt-16" : ""}`}>
      <div
        className={`flex flex-1 justify-center overflow-auto rounded-2xl border border-navy/10 bg-gradient-to-br from-neutral-100/80 via-cream/40 to-sky/20 shadow-studio ${
          focusMode ? "border-white/10" : ""
        }`}
      >
        <motion.div
          animate={{
            width: VIEWPORT_WIDTHS[viewport],
            scale: zoom / 100,
          }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="origin-top min-h-[560px] overflow-y-auto bg-cream shadow-lift"
          style={{ maxWidth: "100%" }}
        >
          <div className="space-y-4 p-4 md:p-6" style={wrapperStyle}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <AnimatePresence initial={false}>
                  {sections.map((section) => (
                    <SortableCanvasSection
                      key={section.id}
                      section={section}
                      theme={theme}
                      selected={selectedId === section.id}
                      locked={lockedIds.has(section.id)}
                      activeField={activeField}
                      setActiveField={setActiveField}
                      onPatchField={onPatchField}
                      onSelect={() => onSelectSection(section.id)}
                      onDuplicate={() => onDuplicate(section.id)}
                      onDelete={() => onDelete(section.id)}
                      onToggleVisibility={() => onToggleVisibility(section.id)}
                      onToggleLock={() => onToggleLock(section.id)}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>

            {sections.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-navy/15 bg-white/60 p-8 text-center">
                <p className="text-lg font-semibold text-navy">Start building visually</p>
                <p className="mt-2 max-w-sm text-sm text-charcoal/60">
                  Add a section from the sidebar or press the + button to open the section library.
                </p>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>

      <FloatingToolbar
        activeField={activeField}
        fieldId={activeField ?? ""}
        position={toolbarPos ?? undefined}
        onDuplicate={selectedSection ? () => onDuplicate(selectedSection.id) : undefined}
        onDelete={selectedSection ? () => onDelete(selectedSection.id) : undefined}
      />
    </div>
  );
}
