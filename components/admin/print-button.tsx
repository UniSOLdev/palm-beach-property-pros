"use client";

export function PrintButton({ label = "Export PDF", className = "admin-btn" }: { label?: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {label}
    </button>
  );
}
