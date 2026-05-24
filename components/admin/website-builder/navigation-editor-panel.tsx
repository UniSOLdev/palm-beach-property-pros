"use client";

import { useState, useTransition } from "react";
import { saveSiteNavigation, type NavItem } from "@/lib/admin/actions/website-navigation";

export function NavigationEditorPanel({ initialItems }: { initialItems: NavItem[] }) {
  const [items, setItems] = useState(
    initialItems.length
      ? initialItems
      : [
          { id: "", label: "Services", href: "/services", is_visible: true, sort_order: 0 },
          { id: "", label: "Quote", href: "/quote", is_visible: true, sort_order: 1 },
          { id: "", label: "Contact", href: "/contact", is_visible: true, sort_order: 2 },
        ],
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function updateItem(index: number, patch: Partial<NavItem>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setSaved(false);
  }

  return (
    <div className="admin-card space-y-3">
      <h3 className="font-bold text-navy">Site navigation</h3>
      <p className="text-xs text-charcoal/70">Header links for the public site when CMS publish is wired.</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item.id || i} className="grid gap-2 rounded-xl border border-navy/10 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              className="admin-input text-sm"
              value={item.label}
              placeholder="Label"
              onChange={(e) => updateItem(i, { label: e.target.value })}
            />
            <input
              className="admin-input text-sm"
              value={item.href}
              placeholder="/path"
              onChange={(e) => updateItem(i, { href: e.target.value })}
            />
            <label className="flex items-center gap-2 text-xs font-medium text-navy">
              <input
                type="checkbox"
                checked={item.is_visible}
                onChange={(e) => updateItem(i, { is_visible: e.target.checked })}
              />
              Visible
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="admin-btn-secondary text-xs"
          onClick={() =>
            setItems((rows) => [
              ...rows,
              { id: "", label: "New link", href: "/", is_visible: true, sort_order: rows.length },
            ])
          }
        >
          + Add link
        </button>
        <button
          type="button"
          disabled={pending}
          className="admin-btn text-xs"
          onClick={() =>
            startTransition(async () => {
              await saveSiteNavigation(
                items.map((item, sort_order) => ({
                  id: item.id || undefined,
                  label: item.label,
                  href: item.href,
                  is_visible: item.is_visible,
                  sort_order,
                })),
              );
              setSaved(true);
            })
          }
        >
          {pending ? "Saving…" : saved ? "Navigation saved" : "Save navigation"}
        </button>
      </div>
    </div>
  );
}
