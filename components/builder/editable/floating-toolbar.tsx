"use client";

import { motion } from "framer-motion";
import type { TextStyle } from "@/components/builder/editable/useEditable";
import {
  ALIGN_CLASS,
  COLOR_CLASS,
  FONT_SIZE_CLASS,
  FONT_WEIGHT_CLASS,
} from "@/components/builder/editable/useEditable";

type Props = {
  activeField: string | null;
  fieldId: string;
  style?: TextStyle;
  onStyleChange?: (style: Partial<TextStyle>) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  position?: { top: number; left: number };
};

export function FloatingToolbar({
  activeField,
  fieldId,
  style = {},
  onStyleChange,
  onDuplicate,
  onDelete,
  position,
}: Props) {
  if (activeField !== fieldId || !position) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4 }}
      className="pointer-events-auto fixed z-[200] flex items-center gap-1 rounded-xl border border-navy/10 bg-white/95 px-2 py-1.5 shadow-lift backdrop-blur-xl"
      style={{ top: position.top - 48, left: position.left, transform: "translateX(-50%)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <select
        className="rounded-lg border border-navy/10 bg-cream/50 px-2 py-1 text-[10px] font-semibold text-navy"
        value={style.fontSize ?? "base"}
        onChange={(e) => onStyleChange?.({ fontSize: e.target.value as TextStyle["fontSize"] })}
      >
        {(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const).map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select
        className="rounded-lg border border-navy/10 bg-cream/50 px-2 py-1 text-[10px] font-semibold text-navy"
        value={style.fontWeight ?? "semibold"}
        onChange={(e) => onStyleChange?.({ fontWeight: e.target.value as TextStyle["fontWeight"] })}
      >
        <option value="normal">Regular</option>
        <option value="medium">Medium</option>
        <option value="semibold">Semibold</option>
        <option value="bold">Bold</option>
      </select>
      <div className="flex rounded-lg border border-navy/10 bg-cream/50 p-0.5">
        {(["left", "center", "right"] as const).map((a) => (
          <button
            key={a}
            type="button"
            className={`rounded-md px-2 py-1 text-[10px] font-bold ${style.align === a ? "bg-navy text-white" : "text-navy"}`}
            onClick={() => onStyleChange?.({ align: a })}
          >
            {a[0].toUpperCase()}
          </button>
        ))}
      </div>
      {onDuplicate ? (
        <button type="button" className="rounded-lg px-2 py-1 text-[10px] font-semibold text-ocean hover:bg-sky/40" onClick={onDuplicate}>
          Copy §
        </button>
      ) : null}
      {onDelete ? (
        <button type="button" className="rounded-lg px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50" onClick={onDelete}>
          Del §
        </button>
      ) : null}
    </motion.div>
  );
}

export function styleToClassName(style?: TextStyle): string {
  if (!style) return "";
  return [
    style.fontSize ? FONT_SIZE_CLASS[style.fontSize] : "",
    style.fontWeight ? FONT_WEIGHT_CLASS[style.fontWeight] : "",
    style.align ? ALIGN_CLASS[style.align] : "",
    style.color ? COLOR_CLASS[style.color] : "",
  ]
    .filter(Boolean)
    .join(" ");
}
