"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-card space-y-3">
      <h1 className="text-xl font-bold text-navy">Something went wrong</h1>
      <p className="text-sm text-charcoal/70">{error.message || "An unexpected error occurred."}</p>
      <button type="button" onClick={reset} className="admin-btn">
        Try again
      </button>
    </div>
  );
}
