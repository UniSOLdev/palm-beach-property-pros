"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ADMIN_MORE_NAV, ADMIN_NAV, QUICK_ACTIONS } from "@/lib/admin/constants";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  keywords: string;
};

const STATIC_ITEMS: CommandItem[] = [
  ...ADMIN_NAV.map((item) => ({
    id: item.href,
    label: item.label,
    href: item.href,
    group: "Navigation",
    keywords: `${item.label} ${item.href}`,
  })),
  ...ADMIN_MORE_NAV.map((item) => ({
    id: item.href,
    label: item.label,
    href: item.href,
    group: "More",
    keywords: `${item.label} ${item.href}`,
  })),
  ...QUICK_ACTIONS.map((item) => ({
    id: item.href,
    label: item.label,
    href: item.href,
    group: "Quick actions",
    keywords: `${item.label} ${item.href}`,
  })),
  { id: "/admin/website", label: "Site Studio", href: "/admin/website", group: "CMS", keywords: "website builder cms studio" },
  { id: "/admin/website/media", label: "Media Library", href: "/admin/website/media", group: "CMS", keywords: "media images upload" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pbpp:open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pbpp:open-command-palette", onOpen);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_ITEMS;
    return STATIC_ITEMS.filter(
      (item) => item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-xl border border-navy/10 bg-white/80 px-3 py-1.5 text-xs text-charcoal/60 transition hover:border-ocean/30 md:flex"
        aria-label="Open command palette"
      >
        <span>Search…</span>
        <kbd className="rounded bg-sky/50 px-1.5 py-0.5 font-mono text-[10px] text-navy">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="cmd-palette-overlay"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="cmd-palette-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                className="w-full border-b border-navy/10 px-4 py-4 text-base text-charcoal outline-none"
                placeholder="Jump to page or action…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((i) => Math.max(i - 1, 0));
                  }
                  if (e.key === "Enter" && filtered[activeIndex]) {
                    navigate(filtered[activeIndex].href);
                  }
                }}
              />
              <ul className="max-h-72 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-charcoal/50">No results</li>
                ) : (
                  filtered.map((item, i) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                          i === activeIndex ? "bg-sky/40 text-navy" : "text-charcoal hover:bg-sky/20"
                        }`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => navigate(item.href)}
                      >
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-xs text-charcoal/50">{item.group}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <p className="border-t border-navy/10 px-4 py-2 text-[10px] text-charcoal/45">
                ↑↓ navigate · ↵ select · esc close
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Mobile-friendly search shortcut link */
export function CommandPaletteMobileTrigger() {
  return (
    <Link
      href="/admin"
      className="admin-btn-secondary min-h-[44px] px-3 text-xs md:hidden"
      onClick={() => window.dispatchEvent(new Event("pbpp:open-command-palette"))}
    >
      Search
    </Link>
  );
}
