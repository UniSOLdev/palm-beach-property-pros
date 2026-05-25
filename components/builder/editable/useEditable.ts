"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TextStyle = {
  fontSize?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right";
  color?: "navy" | "ocean" | "cream" | "charcoal" | "aqua";
};

export type UseEditableOptions = {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void;
  debounceMs?: number;
};

export function useEditable({ value, onChange, onCommit, debounceMs = 400 }: UseEditableOptions) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = useCallback(
    (next: string) => {
      onChange(next);
      onCommit?.(next);
      setEditing(false);
    },
    [onChange, onCommit],
  );

  const cancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
  }, [value]);

  const handleDraftChange = useCallback(
    (next: string) => {
      setDraft(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(next), debounceMs);
    },
    [onChange, debounceMs],
  );

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return {
    editing,
    draft,
    setEditing,
    setDraft: handleDraftChange,
    commit,
    cancel,
  };
}

export const FONT_SIZE_CLASS: Record<NonNullable<TextStyle["fontSize"]>, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl sm:text-5xl",
};

export const FONT_WEIGHT_CLASS: Record<NonNullable<TextStyle["fontWeight"]>, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

export const ALIGN_CLASS: Record<NonNullable<TextStyle["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export const COLOR_CLASS: Record<NonNullable<TextStyle["color"]>, string> = {
  navy: "text-navy",
  ocean: "text-ocean",
  cream: "text-cream",
  charcoal: "text-charcoal/85",
  aqua: "text-aqua",
};
