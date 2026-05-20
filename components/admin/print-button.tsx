"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="admin-btn">
      Export PDF
    </button>
  );
}
