"use client";

export default function AdminLeadsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="admin-card space-y-3">
      <h1 className="text-xl font-bold text-navy">Leads unavailable</h1>
      <p className="text-sm text-charcoal/70">
        {error.message.includes("quote_requests")
          ? "The quote intake table may not exist yet. Apply the quote_requests migration in Supabase."
          : error.message || "Could not load the leads pipeline."}
      </p>
      <button type="button" onClick={reset} className="admin-btn min-h-[48px]">
        Retry
      </button>
    </div>
  );
}
