"use client";

import { useState, useTransition } from "react";
import { saveCmsSection } from "@/lib/admin/actions/cms";

type Section = {
  section_key: string;
  title: string | null;
  content: Record<string, unknown>;
};

export function CmsStudio({ sections }: { sections: Section[] }) {
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(sections.map((s) => [s.section_key, JSON.stringify(s.content, null, 2)])),
  );

  return (
    <ul className="space-y-4">
      {sections.map((section) => (
        <li key={section.section_key} className="admin-card space-y-2">
          <h3 className="font-bold text-navy">{section.title ?? section.section_key}</h3>
          <textarea
            className="admin-input mt-0 min-h-[160px] font-mono text-xs"
            value={drafts[section.section_key]}
            onChange={(e) =>
              setDrafts((d) => ({ ...d, [section.section_key]: e.target.value }))
            }
          />
          <button
            type="button"
            disabled={pending}
            className="admin-btn w-full"
            onClick={() =>
              startTransition(async () => {
                const content = JSON.parse(drafts[section.section_key]) as Record<string, unknown>;
                await saveCmsSection("home", section.section_key, content);
              })
            }
          >
            Save section
          </button>
        </li>
      ))}
    </ul>
  );
}
