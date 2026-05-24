"use client";

import { useState } from "react";
import { MediaPickerModal } from "@/components/admin/media-picker-modal";
import {
  SECTION_TYPE_LABELS,
  type WebsiteSectionRow,
  type WebsiteSectionType,
} from "@/lib/cms/section-registry";

type Props = {
  section: WebsiteSectionRow;
  onChange: (content: Record<string, unknown>) => void;
  onMetaChange: (patch: Partial<Pick<WebsiteSectionRow, "label" | "is_visible">>) => void;
};

export function SectionEditorPanel({ section, onChange, onMetaChange }: Props) {
  const content = section.content;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-navy">{SECTION_TYPE_LABELS[section.section_type]}</h3>
        <label className="flex items-center gap-2 text-xs font-medium text-charcoal">
          <input
            type="checkbox"
            checked={section.is_visible}
            onChange={(e) => onMetaChange({ is_visible: e.target.checked })}
          />
          Visible
        </label>
      </div>

      <label className="block text-sm font-medium text-navy">
        Section label
        <input
          className="admin-input"
          value={section.label ?? ""}
          onChange={(e) => onMetaChange({ label: e.target.value })}
        />
      </label>

      <SectionFields type={section.section_type} content={content} onChange={onChange} />
    </div>
  );
}

function SectionFields({
  type,
  content,
  onChange,
}: {
  type: WebsiteSectionType;
  content: Record<string, unknown>;
  onChange: (content: Record<string, unknown>) => void;
}) {
  switch (type) {
    case "hero":
      return <HeroEditor content={content} onChange={onChange} />;
    case "services":
      return <ServicesEditor content={content} onChange={onChange} />;
    case "stats":
      return <RepeaterEditor
        content={content}
        onChange={onChange}
        arrayKey="items"
        itemLabel="Stat"
        fields={[
          { key: "value", label: "Value", placeholder: "500+" },
          { key: "label", label: "Label", placeholder: "Properties served" },
        ]}
        extras={
          <>
            <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
          </>
        }
      />;
    case "testimonials":
      return (
        <RepeaterEditor
          content={content}
          onChange={onChange}
          arrayKey="items"
          itemLabel="Testimonial"
          fields={[
            { key: "quote", label: "Quote", multiline: true },
            { key: "author", label: "Author" },
            { key: "rating", label: "Rating (1-5)", type: "number" },
          ]}
          extras={
            <TextField
              label="Headline"
              value={(content.headline as string) ?? ""}
              onChange={(v) => onChange({ ...content, headline: v })}
            />
          }
        />
      );
    case "faq":
      return (
        <RepeaterEditor
          content={content}
          onChange={onChange}
          arrayKey="items"
          itemLabel="Question"
          fields={[
            { key: "question", label: "Question" },
            { key: "answer", label: "Answer", multiline: true },
          ]}
          extras={
            <TextField
              label="Headline"
              value={(content.headline as string) ?? ""}
              onChange={(v) => onChange({ ...content, headline: v })}
            />
          }
        />
      );
    case "cta":
      return <CtaEditor content={content} onChange={onChange} />;
    case "quote_form":
      return <QuoteFormEditor content={content} onChange={onChange} />;
    case "gallery":
      return <GalleryEditor content={content} onChange={onChange} />;
    case "before_after":
      return <BeforeAfterEditor content={content} onChange={onChange} />;
    case "process":
      return (
        <RepeaterEditor
          content={content}
          onChange={onChange}
          arrayKey="steps"
          itemLabel="Step"
          fields={[
            { key: "title", label: "Title" },
            { key: "body", label: "Body", multiline: true },
          ]}
          extras={
            <TextField
              label="Headline"
              value={(content.headline as string) ?? ""}
              onChange={(v) => onChange({ ...content, headline: v })}
            />
          }
        />
      );
    case "video":
      return (
        <div className="space-y-3">
          <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
          <TextField label="Video URL" value={(content.videoUrl as string) ?? ""} onChange={(v) => onChange({ ...content, videoUrl: v })} />
          <MediaField label="Poster image" value={(content.posterUrl as string) ?? ""} onChange={(v) => onChange({ ...content, posterUrl: v })} />
        </div>
      );
    default:
      return (
        <div className="space-y-3">
          <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
          <TextField label="Body" value={(content.body as string) ?? ""} onChange={(v) => onChange({ ...content, body: v })} multiline />
        </div>
      );
  }
}

function HeroEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const c = content as Record<string, string | string[] | { label: string; href: string } | undefined>;
  const chips = (c.chips as string[]) ?? [];
  const primary = c.primaryCta as { label: string; href: string } | undefined;
  const secondary = c.secondaryCta as { label: string; href: string } | undefined;

  return (
    <div className="space-y-3">
      <TextField label="Eyebrow" value={(c.eyebrow as string) ?? ""} onChange={(v) => onChange({ ...content, eyebrow: v })} />
      <TextField label="Headline" value={(c.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
      <TextField label="Subheadline" value={(c.subheadline as string) ?? ""} onChange={(v) => onChange({ ...content, subheadline: v })} multiline />
      <MediaField label="Hero image" value={(c.imageUrl as string) ?? ""} onChange={(v) => onChange({ ...content, imageUrl: v })} />
      <TextField
        label="Chips (comma-separated)"
        value={chips.join(", ")}
        onChange={(v) => onChange({ ...content, chips: v.split(",").map((s) => s.trim()).filter(Boolean) })}
      />
      <LinkPair label="Primary CTA" link={primary} onChange={(link) => onChange({ ...content, primaryCta: link })} />
      <LinkPair label="Secondary CTA" link={secondary} onChange={(link) => onChange({ ...content, secondaryCta: link })} />
    </div>
  );
}

function ServicesEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const columns = (content.columns as Array<{ title: string; body: string; links: Array<{ label: string; href: string }> }>) ?? [];

  function updateColumn(i: number, patch: Partial<(typeof columns)[0]>) {
    const next = columns.map((col, idx) => (idx === i ? { ...col, ...patch } : col));
    onChange({ ...content, columns: next });
  }

  function addColumn() {
    onChange({ ...content, columns: [...columns, { title: "New column", body: "", links: [] }] });
  }

  return (
    <div className="space-y-3">
      <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
      <TextField label="Subheadline" value={(content.subheadline as string) ?? ""} onChange={(v) => onChange({ ...content, subheadline: v })} multiline />
      {columns.map((col, i) => (
        <div key={i} className="rounded-xl border border-navy/10 bg-sky/20 p-3 space-y-2">
          <p className="text-xs font-bold uppercase text-ocean">Column {i + 1}</p>
          <TextField label="Title" value={col.title} onChange={(v) => updateColumn(i, { title: v })} />
          <TextField label="Body" value={col.body} onChange={(v) => updateColumn(i, { body: v })} multiline />
          <button
            type="button"
            className="text-xs font-semibold text-red-700"
            onClick={() => onChange({ ...content, columns: columns.filter((_, idx) => idx !== i) })}
          >
            Remove column
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn-secondary w-full text-xs" onClick={addColumn}>
        + Add column
      </button>
    </div>
  );
}

function CtaEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const primary = content.primaryCta as { label: string; href: string } | undefined;
  return (
    <div className="space-y-3">
      <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
      <TextField label="Body" value={(content.body as string) ?? ""} onChange={(v) => onChange({ ...content, body: v })} multiline />
      <LinkPair label="Primary CTA" link={primary} onChange={(link) => onChange({ ...content, primaryCta: link })} />
      <TextField label="Phone" value={(content.phone as string) ?? ""} onChange={(v) => onChange({ ...content, phone: v })} />
    </div>
  );
}

function QuoteFormEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
      <TextField label="Body" value={(content.body as string) ?? ""} onChange={(v) => onChange({ ...content, body: v })} multiline />
      <TextField label="Button label" value={(content.buttonLabel as string) ?? ""} onChange={(v) => onChange({ ...content, buttonLabel: v })} />
      <TextField label="Button link" value={(content.buttonHref as string) ?? ""} onChange={(v) => onChange({ ...content, buttonHref: v })} />
    </div>
  );
}

function GalleryEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const items = (content.items as Array<{ label: string; imageUrl?: string }>) ?? [];

  return (
    <div className="space-y-3">
      <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-navy/10 p-3 space-y-2">
          <TextField label="Label" value={item.label} onChange={(v) => {
            const next = items.map((it, idx) => (idx === i ? { ...it, label: v } : it));
            onChange({ ...content, items: next });
          }} />
          <MediaField label="Image" value={item.imageUrl ?? ""} onChange={(v) => {
            const next = items.map((it, idx) => (idx === i ? { ...it, imageUrl: v } : it));
            onChange({ ...content, items: next });
          }} />
          <button type="button" className="text-xs text-red-700" onClick={() => onChange({ ...content, items: items.filter((_, idx) => idx !== i) })}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn-secondary w-full text-xs" onClick={() => onChange({ ...content, items: [...items, { label: "Photo", imageUrl: "" }] })}>
        + Add image
      </button>
    </div>
  );
}

function BeforeAfterEditor({ content, onChange }: { content: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const pairs = (content.pairs as Array<{ label: string; beforeUrl?: string; afterUrl?: string }>) ?? [];

  return (
    <div className="space-y-3">
      <TextField label="Headline" value={(content.headline as string) ?? ""} onChange={(v) => onChange({ ...content, headline: v })} />
      {pairs.map((pair, i) => (
        <div key={i} className="rounded-xl border border-navy/10 p-3 space-y-2">
          <TextField label="Label" value={pair.label} onChange={(v) => {
            const next = pairs.map((p, idx) => (idx === i ? { ...p, label: v } : p));
            onChange({ ...content, pairs: next });
          }} />
          <MediaField label="Before" value={pair.beforeUrl ?? ""} onChange={(v) => {
            const next = pairs.map((p, idx) => (idx === i ? { ...p, beforeUrl: v } : p));
            onChange({ ...content, pairs: next });
          }} />
          <MediaField label="After" value={pair.afterUrl ?? ""} onChange={(v) => {
            const next = pairs.map((p, idx) => (idx === i ? { ...p, afterUrl: v } : p));
            onChange({ ...content, pairs: next });
          }} />
          <button type="button" className="text-xs text-red-700" onClick={() => onChange({ ...content, pairs: pairs.filter((_, idx) => idx !== i) })}>
            Remove pair
          </button>
        </div>
      ))}
      <button type="button" className="admin-btn-secondary w-full text-xs" onClick={() => onChange({ ...content, pairs: [...pairs, { label: "Project", beforeUrl: "", afterUrl: "" }] })}>
        + Add before/after pair
      </button>
    </div>
  );
}

function RepeaterEditor({
  content,
  onChange,
  arrayKey,
  itemLabel,
  fields,
  extras,
}: {
  content: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
  arrayKey: string;
  itemLabel: string;
  fields: Array<{ key: string; label: string; multiline?: boolean; type?: string; placeholder?: string }>;
  extras?: React.ReactNode;
}) {
  const items = (content[arrayKey] as Array<Record<string, unknown>>) ?? [];

  return (
    <div className="space-y-3">
      {extras}
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-navy/10 bg-white p-3 space-y-2">
          <p className="text-xs font-bold uppercase text-ocean">{itemLabel} {i + 1}</p>
          {fields.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              value={String(item[f.key] ?? "")}
              multiline={f.multiline}
              type={f.type}
              placeholder={f.placeholder}
              onChange={(v) => {
                const val = f.type === "number" ? Number(v) : v;
                const next = items.map((it, idx) => (idx === i ? { ...it, [f.key]: val } : it));
                onChange({ ...content, [arrayKey]: next });
              }}
            />
          ))}
          <button type="button" className="text-xs text-red-700" onClick={() => onChange({ ...content, [arrayKey]: items.filter((_, idx) => idx !== i) })}>
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="admin-btn-secondary w-full text-xs"
        onClick={() => onChange({ ...content, [arrayKey]: [...items, Object.fromEntries(fields.map((f) => [f.key, f.type === "number" ? 5 : ""]))] })}
      >
        + Add {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      {multiline ? (
        <textarea className="admin-input min-h-[80px]" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="admin-input" type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function LinkPair({
  label,
  link,
  onChange,
}: {
  label: string;
  link?: { label: string; href: string };
  onChange: (link: { label: string; href: string }) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-navy/10 p-3 space-y-2">
      <legend className="px-1 text-xs font-bold uppercase text-ocean">{label}</legend>
      <TextField label="Label" value={link?.label ?? ""} onChange={(v) => onChange({ label: v, href: link?.href ?? "/" })} />
      <TextField label="URL" value={link?.href ?? ""} onChange={(v) => onChange({ label: link?.label ?? "", href: v })} />
    </fieldset>
  );
}

function MediaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium text-navy">{label}</label>
      <div className="mt-1 flex gap-2">
        <input className="admin-input flex-1" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://..." />
        <button type="button" className="admin-btn-secondary shrink-0 text-xs" onClick={() => setOpen(true)}>
          Library
        </button>
      </div>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 w-full rounded-lg object-cover" />
      ) : null}
      <MediaPickerModal open={open} onClose={() => setOpen(false)} onSelect={(url) => { onChange(url); setOpen(false); }} />
    </div>
  );
}
