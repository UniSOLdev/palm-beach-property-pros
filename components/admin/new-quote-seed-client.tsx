"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AdminPageHeader } from "@/components/admin/ui";
import { QuoteBuilder } from "@/components/admin/quote-builder";
import { makeBlankQuote } from "@/lib/admin/quote-factory";
import { adminSeed } from "@/lib/admin/seed";

export function NewQuoteSeedClient() {
  const initial = useMemo(() => makeBlankQuote(adminSeed.clients[0].id), []);

  return (
    <div>
      <AdminPageHeader
        title="New quote"
        subtitle="Start from a blank estimate or load the move-out template inside the builder."
        actions={
          <Link href="/admin/quotes" className="btn-secondary no-underline">
            Back
          </Link>
        }
      />
      <QuoteBuilder initialQuote={initial} clientName={adminSeed.clients[0].name} mode="new" dataMode="seed" />
    </div>
  );
}
