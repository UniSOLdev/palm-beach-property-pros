"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/faq";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-navy/[0.08] overflow-hidden rounded-2xl border border-navy/[0.08] bg-white/90 shadow-card backdrop-blur-sm">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm font-semibold tracking-tight text-navy transition-colors hover:bg-cream-warm/50 sm:text-base"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {item.question}
              <span className="text-aqua-muted" aria-hidden>
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <p className="px-6 pb-5 text-sm leading-relaxed text-charcoal/75">
                {item.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
