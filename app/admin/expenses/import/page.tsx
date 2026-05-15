export const dynamic = "force-dynamic";

import Link from "next/link";

import { ExpenseImportConsole } from "@/components/admin/expense-import-console";

export const metadata = {
  title: "Import expenses",
};

export default function AdminExpenseImportPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-400/90">PBPP finance rail</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Import expenses</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Production-safe ingest from Google Sheets or CSV exports. Preview validates rows, surfaces duplicates, and
            keeps your analytics consistent.
          </p>
        </div>
        <Link
          href="/admin/expenses"
          className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-100 no-underline transition hover:bg-white/5"
        >
          ← Overview
        </Link>
      </div>

      <ExpenseImportConsole />
    </div>
  );
}
