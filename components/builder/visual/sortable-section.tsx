"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { SectionRenderer } from "@/components/cms/sections/section-renderer";
import { SectionOverlay } from "@/components/builder/visual/section-overlay";
import type { WebsiteSectionRow } from "@/lib/cms/section-registry";

type Props = {
  section: WebsiteSectionRow;
  theme?: Record<string, unknown>;
  selected: boolean;
  locked: boolean;
  activeField: string | null;
  setActiveField: (field: string | null) => void;
  onPatchField: (sectionId: string, path: string, value: unknown) => void;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
};

export function SortableCanvasSection({
  section,
  theme,
  selected,
  locked,
  activeField,
  setActiveField,
  onPatchField,
  onSelect,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const sectionEditor = {
    enabled: true,
    sectionId: section.id,
    activeField,
    setActiveField,
    patchField: (path: string, value: unknown) => onPatchField(section.id, path, value),
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`group/canvas relative ${isDragging ? "opacity-90" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <SectionOverlay
        section={section}
        selected={selected}
        locked={locked}
        onSelect={onSelect}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onToggleVisibility={onToggleVisibility}
        onToggleLock={onToggleLock}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
      <div className={`relative ${!section.is_visible ? "opacity-50" : ""}`}>
        <SectionRenderer section={section} theme={theme} preview editor={sectionEditor} />
      </div>
    </motion.div>
  );
}
