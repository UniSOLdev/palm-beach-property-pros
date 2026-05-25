"use client";

import { useState } from "react";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";

type Props = {
  value: string;
  onChange: (value: string) => void;
  fieldId: string;
  activeField: string | null;
  onActivate: (fieldId: string) => void;
  className?: string;
  alt?: string;
};

export function EditableImage({
  value,
  onChange,
  fieldId,
  activeField,
  onActivate,
  className = "",
  alt = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const isActive = activeField === fieldId;

  return (
    <div
      className={`group/img relative cursor-pointer ${className} ${isActive ? "ring-2 ring-ocean ring-offset-2" : "hover:ring-2 hover:ring-ocean/40 hover:ring-offset-1"}`}
      onClick={(e) => {
        e.stopPropagation();
        onActivate(fieldId);
        setOpen(true);
      }}
      role="button"
      tabIndex={0}
      data-editable-field={fieldId}
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full min-h-[120px] items-center justify-center bg-sky/30 text-sm text-charcoal/50">
          Click to add image
        </div>
      )}
      <span className="absolute right-2 top-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover/img:opacity-100">
        Change
      </span>
      <MediaPickerModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setOpen(false);
        }}
      />
    </div>
  );
}
