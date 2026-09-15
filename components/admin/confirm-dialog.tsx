"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="admin-card w-[min(100%,28rem)] max-w-lg rounded-2xl border border-navy/10 p-0 shadow-luxury backdrop:bg-navy-deep/40"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        <div className="mt-3 text-sm leading-relaxed text-charcoal/75">{description}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" className="admin-btn-secondary min-h-[44px]" disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? "admin-btn min-h-[44px] bg-red-700 hover:bg-red-800" : "admin-btn min-h-[44px]"}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
