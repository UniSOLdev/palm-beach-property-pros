"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-6 rounded-lg border border-navy/20 bg-navy px-4 py-2 text-sm font-semibold text-cream"
    >
      Print or save as PDF
    </button>
  );
}
