"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { runBuilderAICommand, parseAICommand } from "@/lib/builder/ai/commands";

type Props = {
  open: boolean;
  onClose: () => void;
  onApplyText: (text: string) => void;
  sectionType?: string;
  pageTitle?: string;
};

export function BuilderAIPalette({ open, onClose, onApplyText, sectionType, pageTitle }: Props) {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState("");

  const suggestions = [
    "Make site more luxury",
    "Rewrite CTA",
    "Improve SEO",
    "Generate Palm Beach copy",
    "Generate FAQ",
  ];

  async function runCommand(text: string) {
    setPending(true);
    setResult("");
    try {
      const cmd = parseAICommand(text);
      if (!cmd) {
        setResult("Try: make luxury, rewrite CTA, improve SEO, generate FAQ, generate homepage");
        return;
      }
      const out = await runBuilderAICommand(cmd, {
        sectionType: sectionType as never,
        currentText: text,
        pageTitle,
      });
      const textOut = typeof out.output === "string" ? out.output : JSON.stringify(out.output, null, 2);
      setResult(`[${out.provider}] ${textOut}`);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "AI command failed");
    } finally {
      setPending(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-navy/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-[12vh] w-full max-w-lg rounded-2xl border border-navy/10 bg-white p-4 shadow-lift"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-bold text-navy">Builder AI</h3>
          <p className="text-xs text-charcoal/60">Section-aware commands · provider abstraction</p>
          <input
            autoFocus
            className="admin-input mt-3 text-sm"
            placeholder="e.g. Make site more luxury…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runCommand(query)}
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button key={s} type="button" className="rounded-full bg-sky/40 px-2 py-1 text-[10px] font-semibold text-navy" onClick={() => { setQuery(s); runCommand(s); }}>
                {s}
              </button>
            ))}
          </div>
          {result ? <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-cream/80 p-3 text-xs text-charcoal">{result}</pre> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={pending} className="admin-btn flex-1 text-xs" onClick={() => runCommand(query)}>
              {pending ? "Running…" : "Run command"}
            </button>
            {result && typeof result === "string" ? (
              <button type="button" className="admin-btn-secondary text-xs" onClick={() => { onApplyText(result.replace(/^\[[^\]]+\]\s*/, "")); onClose(); }}>
                Apply
              </button>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
