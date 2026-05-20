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
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(sections.map((s) => [s.section_key, JSON.stringify(s.content, null, 2)])),
  );

  return (
    <ul className="space-y-4">
      {error ? <li className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</li> : null}
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
                setError("");
                try {
                  const content = JSON.parse(drafts[section.section_key]) as Record<string, unknown>;
                  await saveCmsSection("home", section.section_key, content);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? `${section.section_key}: ${err.message}`
                      : `Could not save ${section.section_key}`,
                  );
                }
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
