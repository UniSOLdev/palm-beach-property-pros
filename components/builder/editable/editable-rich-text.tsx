"use client";

import { EditableText } from "@/components/builder/editable/editable-text";
import type { TextStyle } from "@/components/builder/editable/useEditable";

type Props = {
  value: string;
  onChange: (value: string) => void;
  fieldId: string;
  activeField: string | null;
  onActivate: (fieldId: string) => void;
  onDeactivate: () => void;
  className?: string;
  placeholder?: string;
  style?: TextStyle;
};

/** Multiline rich-ish text block for body copy in sections. */
export function EditableRichText({
  value,
  onChange,
  fieldId,
  activeField,
  onActivate,
  onDeactivate,
  className = "",
  placeholder = "Click to edit…",
  style,
}: Props) {
  return (
    <EditableText
      value={value}
      onChange={onChange}
      fieldId={fieldId}
      activeField={activeField}
      onActivate={onActivate}
      onDeactivate={onDeactivate}
      className={className}
      placeholder={placeholder}
      multiline
      style={style}
    />
  );
}
