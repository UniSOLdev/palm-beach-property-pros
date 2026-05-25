"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_LABELS, searchSections, type SectionRegistryEntry } from "@/lib/builder/registry";
import type { WebsiteSectionType } from "@/lib/cms/section-registry";

type Props = {
  open: boolean;
  onClose: () => void;
  onInsert: (type: WebsiteSectionType) => void;
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

export function AddSectionModal({ open, onClose, onInsert }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [preview, setPreview] = useState<SectionRegistryEntry | null>(null);

  const results = useMemo(() => {
    let list = searchSections(query);
    if (category !== "all") list = list.filter((e) => e.category === category);
    return list;
  }, [query, category]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-start justify-center bg-navy/50 p-4 pt-[10vh] backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
          className="w-full max-w-3xl overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-lift"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-navy/10 bg-gradient-to-r from-cream via-white to-sky/30 px-5 py-4">
            <h2 className="text-lg font-bold text-navy">Insert section</h2>
            <p className="text-xs text-charcoal/60">Browse blocks · Framer-style library</p>
            <input
              autoFocus
              className="admin-input mt-3 text-sm"
              placeholder="Search sections…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <FilterChip active={category === "all"} onClick={() => setCategory("all")} label="All" />
              {CATEGORIES.map((c) => (
                <FilterChip
                  key={c}
                  active={category === c}
                  onClick={() => setCategory(c)}
                  label={CATEGORY_LABELS[c]}
                />
              ))}
            </div>
          </div>

          <div className="grid max-h-[50vh] grid-cols-1 gap-0 md:grid-cols-[1fr_280px]">
            <ul className="overflow-y-auto p-3">
              {results.map((entry) => (
                <li key={entry.type}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-sky/30 ${
                      preview?.type === entry.type ? "bg-sky/40 ring-1 ring-ocean/30" : ""
                    }`}
                    onMouseEnter={() => setPreview(entry)}
                    onClick={() => {
                      onInsert(entry.type);
                      onClose();
                    }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/5 text-lg">
                      {entry.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-navy">{entry.label}</p>
                      <p className="text-xs text-charcoal/60">{entry.description}</p>
                    </div>
                  </button>
                </li>
              ))}
              {results.length === 0 ? (
                <li className="py-8 text-center text-sm text-charcoal/50">No sections match</li>
              ) : null}
            </ul>

            <div className="hidden border-l border-navy/10 bg-cream/30 p-4 md:block">
              {preview ? (
                <>
                  <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-ocean text-4xl text-white/90 shadow-card">
                    {preview.icon}
                  </div>
                  <p className="mt-3 font-bold text-navy">{preview.label}</p>
                  <p className="mt-1 text-xs text-charcoal/70">{preview.description}</p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-ocean">
                    {CATEGORY_LABELS[preview.category]}
                  </p>
                  {preview.supportsDynamicData ? (
                    <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                      Live business data
                    </span>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-charcoal/50">Hover a section to preview</p>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
        active ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-navy/10 hover:bg-sky/40"
      }`}
    >
      {label}
    </button>
  );
}
