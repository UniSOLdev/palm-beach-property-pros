"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useEditable, type TextStyle } from "@/components/builder/editable/useEditable";
import { styleToClassName } from "@/components/builder/editable/floating-toolbar";

type Props = {
  value: string;
  onChange: (value: string) => void;
  fieldId: string;
  activeField: string | null;
  onActivate: (fieldId: string) => void;
  onDeactivate: () => void;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  style?: TextStyle;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
};

export function EditableText({
  value,
  onChange,
  fieldId,
  activeField,
  onActivate,
  onDeactivate,
  as: Tag = "span",
  style,
  className = "",
  placeholder = "Click to edit…",
  multiline = false,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const { editing, draft, setEditing, setDraft, commit, cancel } = useEditable({
    value,
    onChange,
  });

  const isActive = activeField === fieldId;
  const styleClass = styleToClassName(style);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancel();
        onDeactivate();
      }
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        commit(draft);
        onDeactivate();
      }
      if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commit(draft);
        onDeactivate();
      }
    },
    [cancel, commit, draft, multiline, onDeactivate],
  );

  const handleBlur = useCallback(() => {
    commit(draft);
    onDeactivate();
  }, [commit, draft, onDeactivate]);

  if (editing || isActive) {
    const shared = {
      ref: ref as never,
      className: `outline-none ring-2 ring-ocean/60 ring-offset-2 rounded-md bg-white/90 px-1 ${styleClass} ${className}`,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
      onClick: (e: React.MouseEvent) => e.stopPropagation(),
      autoFocus: true,
      placeholder,
    };

    if (multiline) {
      return (
      <textarea
        {...shared}
        rows={3}
        className={`${shared.className} w-full resize-none`}
        data-editable-field={fieldId}
      />
    );
    }

    return <input type="text" {...shared} className={`${shared.className} min-w-[120px]`} data-editable-field={fieldId} />;
  }

  return (
    <motion.span
      layout="position"
      role="button"
      tabIndex={0}
      data-editable-field={fieldId}
      className={`group/edit relative cursor-text rounded-md transition-all duration-200 hover:outline hover:outline-2 hover:outline-ocean/30 hover:outline-offset-2 ${styleClass} ${className} ${!value ? "text-charcoal/40 italic" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onActivate(fieldId);
        setEditing(true);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.stopPropagation();
          onActivate(fieldId);
          setEditing(true);
        }
      }}
    >
      {value || placeholder}
    </motion.span>
  );
}

/** Render as semantic heading while keeping editable behavior */
export function EditableHeading(props: Omit<Props, "as"> & { level?: 1 | 2 | 3 }) {
  const Tag = props.level === 1 ? "h1" : props.level === 2 ? "h2" : "h3";
  return <EditableText {...props} as={Tag as "h1"} />;
}
