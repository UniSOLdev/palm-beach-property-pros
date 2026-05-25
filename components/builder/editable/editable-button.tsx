"use client";

import { EditableText } from "@/components/builder/editable/editable-text";

type Props = {
  label: string;
  href?: string;
  onLabelChange: (label: string) => void;
  fieldId: string;
  activeField: string | null;
  onActivate: (fieldId: string) => void;
  onDeactivate: () => void;
  variant?: "primary" | "secondary" | "inverse";
  className?: string;
};

const VARIANT_CLASS = {
  primary: "btn-primary-lg",
  secondary: "btn-secondary-lg",
  inverse: "btn-inverse-lg",
};

export function EditableButton({
  label,
  onLabelChange,
  fieldId,
  activeField,
  onActivate,
  onDeactivate,
  variant = "primary",
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex ${VARIANT_CLASS[variant]} ${className}`}
      onClick={(e) => e.stopPropagation()}
      data-editable-field={fieldId}
    >
      <EditableText
        value={label}
        onChange={onLabelChange}
        fieldId={fieldId}
        activeField={activeField}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
        className="text-inherit"
        placeholder="Button label"
      />
    </span>
  );
}
