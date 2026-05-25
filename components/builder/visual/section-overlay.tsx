"use client";

import { motion } from "framer-motion";
import type { WebsiteSectionRow } from "@/lib/cms/section-registry";
import { SECTION_TYPE_LABELS } from "@/lib/cms/section-registry";

type Props = {
  section: WebsiteSectionRow;
  selected: boolean;
  locked?: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
};

export function SectionOverlay({
  section,
  selected,
  locked,
  onSelect,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onToggleLock,
  dragHandleProps,
  isDragging,
}: Props) {
  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 z-20 rounded-3xl transition-all duration-300 ${
          selected ? "ring-2 ring-ocean shadow-glow" : "ring-0 group-hover/canvas:ring-1 group-hover/canvas:ring-ocean/25"
        } ${isDragging ? "scale-[1.02] shadow-lift" : ""}`}
      />
      <div
        className={`absolute left-1/2 top-2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-navy/10 bg-white/95 px-2 py-1 shadow-lift backdrop-blur-xl transition-all duration-200 ${
          selected ? "opacity-100" : "pointer-events-none opacity-0 group-hover/canvas:pointer-events-auto group-hover/canvas:opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="flex h-7 w-7 cursor-grab items-center justify-center rounded-lg text-charcoal/50 hover:bg-sky/40 active:cursor-grabbing"
          aria-label="Drag section"
          {...dragHandleProps}
        >
          ⋮⋮
        </button>
        <span className="max-w-[100px] truncate px-1 text-[10px] font-semibold text-navy">
          {section.label ?? SECTION_TYPE_LABELS[section.section_type]}
        </span>
        <button type="button" className="rounded-lg px-2 py-1 text-[10px] font-semibold text-ocean hover:bg-sky/40" onClick={onSelect}>
          Edit
        </button>
        <button type="button" className="rounded-lg px-2 py-1 text-[10px] font-semibold text-ocean hover:bg-sky/40" onClick={onDuplicate}>
          Copy
        </button>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-[10px] font-semibold text-charcoal hover:bg-sky/40"
          onClick={onToggleVisibility}
          title={section.is_visible ? "Hide section" : "Show section"}
        >
          {section.is_visible ? "👁" : "🚫"}
        </button>
        <button
          type="button"
          className={`rounded-lg px-2 py-1 text-[10px] font-semibold hover:bg-sky/40 ${locked ? "text-amber-700" : "text-charcoal"}`}
          onClick={onToggleLock}
          title={locked ? "Unlock section" : "Lock section"}
        >
          {locked ? "🔒" : "🔓"}
        </button>
        <button type="button" className="rounded-lg px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50" onClick={onDelete}>
          Del
        </button>
      </div>
      {!section.is_visible ? (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-3xl bg-charcoal/20 backdrop-blur-[1px]" />
      ) : null}
      {locked ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none absolute bottom-2 right-2 z-30 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900"
        >
          Locked
        </motion.div>
      ) : null}
    </>
  );
}
