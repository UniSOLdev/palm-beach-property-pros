"use client";

import Link from "next/link";

export default function PublicQuoteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <h1 className="text-lg font-bold text-navy">Quote link error</h1>
        <p className="mt-2 text-sm text-charcoal/80">We could not display this quote. Please try again or contact us.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="btn-secondary px-4 py-2 text-sm">
            Retry
          </button>
          <Link href="/quote" className="btn-primary px-4 py-2 text-sm no-underline">
            Request a quote
          </Link>
        </div>
      </div>
    </main>
  );
}
