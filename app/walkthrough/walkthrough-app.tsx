"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ADD_ON_SERVICES,
  CLEANING_TYPES,
  CONDITION_OPTIONS,
  OCCUPANCY_OPTIONS,
  PROPERTY_TYPES,
  WALKTHROUGH_SECTIONS,
} from "@/lib/walkthrough/config";
import { createPhotoAssets, createWalkthroughJob, touchJob } from "@/lib/walkthrough/job";
import { calculateWalkthroughQuote, getSelectedAddOns } from "@/lib/walkthrough/quote-engine";
import { generateClientScope } from "@/lib/walkthrough/scope";
import type {
  AddOnId,
  ChecklistItem,
  CleaningType,
  Condition,
  PhotoScope,
  PropertyIntake,
  PropertyType,
  QuoteResult,
  WalkthroughJob,
  WalkthroughPhoto,
  WalkthroughSectionId,
} from "@/lib/walkthrough/types";

const steps = [
  { id: "intake", label: "Intake" },
  { id: "checklist", label: "Checklist" },
  { id: "addons", label: "Add-ons" },
  { id: "quote", label: "Quote" },
  { id: "scope", label: "Scope" },
] as const;

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-sky-400/10";

const selectClass = `${inputClass} appearance-none`;

export function WalkthroughApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [job, setJob] = useState<WalkthroughJob>(() => createWalkthroughJob());
  const [scopeCopied, setScopeCopied] = useState(false);

  const { property, checklist } = job;
  const selectedAddOns = job.selectedAddOnIds;
  const selectedAddOnSet = useMemo(() => new Set(selectedAddOns), [selectedAddOns]);
  const selectedAddOnDetails = useMemo(
    () => getSelectedAddOns(job.selectedAddOnIds),
    [job.selectedAddOnIds],
  );
  const photoCount = countJobPhotos(job);

  const quote = useMemo(() => calculateWalkthroughQuote(job), [job]);

  const clientScope = useMemo(() => generateClientScope(job, quote), [job, quote]);

  function handleAccessSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.trim().toLowerCase() === "pbpp") {
      setUnlocked(true);
      setAccessError("");
      return;
    }
    setAccessError("Enter the internal walkthrough password.");
  }

  function updateProperty<K extends keyof PropertyIntake>(field: K, value: PropertyIntake[K]) {
    updateJob((current) => ({
      ...current,
      property: {
        ...current.property,
        [field]: value,
      },
    }));
  }

  function updateChecklist(sectionId: WalkthroughSectionId, update: Partial<ChecklistItem>) {
    updateJob((current) => ({
      ...current,
      checklist: {
        ...current.checklist,
        [sectionId]: {
          ...current.checklist[sectionId],
          ...update,
        },
      },
    }));
  }

  function updatePropertyPhotos(photos: WalkthroughPhoto[]) {
    updateJob((current) => ({
      ...current,
      propertyPhotos: photos,
    }));
  }

  function toggleAddOn(addOnId: AddOnId) {
    updateJob((current) => ({
      ...current,
      selectedAddOnIds: current.selectedAddOnIds.includes(addOnId)
        ? current.selectedAddOnIds.filter((id) => id !== addOnId)
        : [...current.selectedAddOnIds, addOnId],
    }));
  }

  function updateJob(updater: (current: WalkthroughJob) => WalkthroughJob) {
    setJob((current) => touchJob(updater(current)));
  }

  async function copyScope() {
    await navigator.clipboard.writeText(clientScope);
    setScopeCopied(true);
    window.setTimeout(() => setScopeCopied(false), 1600);
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#050609] px-4 py-6 text-white">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
          <form
            onSubmit={handleAccessSubmit}
            className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/70">
                  PBPP Internal
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Walkthrough Ops</h1>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sm font-bold text-black">
                P
              </div>
            </div>
            <p className="text-sm leading-6 text-white/60">
              Hidden field-service workspace for property intake, walkthrough notes, quoting, and
              client scope drafting.
            </p>
            <label className="mt-8 block text-sm font-medium text-white/80">
              Access password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder="Internal password"
              />
            </label>
            {accessError ? <p className="mt-3 text-sm text-red-300">{accessError}</p> : null}
            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black shadow-[0_18px_50px_rgba(255,255,255,0.12)] transition hover:bg-sky-100"
            >
              Open walkthrough
            </button>
            <p className="mt-4 text-center text-xs text-white/35">
              Direct URL only. Not linked from the public site.
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050609] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_34%),radial-gradient(circle_at_90%_12%,rgba(232,220,200,0.14),transparent_30%),linear-gradient(180deg,#050609_0%,#0a0d13_52%,#050609_100%)]" />

      <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-4 sm:px-6 lg:pb-12">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#050609]/86 px-4 py-3 backdrop-blur-2xl sm:-mx-6 sm:px-6 lg:static lg:border-0 lg:bg-transparent lg:px-0 lg:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/70">
                PBPP Operations OS
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-4xl">
                Walkthrough + Quote Builder
              </h1>
            </div>
            <div className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold text-emerald-100 sm:block">
              Internal tool
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Walkthrough steps">
            {steps.map((step, index) => (
              <a
                key={step.id}
                href={`#${step.id}`}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/70 no-underline transition hover:border-sky-300/40 hover:text-white"
              >
                {index + 1}. {step.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/45 sm:max-w-xl">
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              Job model v{job.version}
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              {photoCount} photos
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              AI-ready
            </div>
          </div>
        </header>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="space-y-5">
            <SectionCard
              id="intake"
              kicker="Step 01"
              title="Property intake"
              description="Capture the essentials before walking rooms. Everything stays local in this browser session."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client Name">
                  <input
                    value={property.clientName}
                    onChange={(event) => updateProperty("clientName", event.target.value)}
                    className={inputClass}
                    placeholder="Owner, agent, or manager"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={property.phone}
                    onChange={(event) => updateProperty("phone", event.target.value)}
                    className={inputClass}
                    placeholder="Best callback number"
                    type="tel"
                    autoComplete="tel"
                  />
                </Field>
              </div>

              <Field label="Address">
                <input
                  value={property.address}
                  onChange={(event) => updateProperty("address", event.target.value)}
                  className={inputClass}
                  placeholder="Property address"
                  autoComplete="street-address"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input
                    value={property.email}
                    onChange={(event) => updateProperty("email", event.target.value)}
                    className={inputClass}
                    placeholder="Client email"
                    type="email"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Square Footage">
                  <input
                    value={property.squareFootage}
                    onChange={(event) => updateProperty("squareFootage", event.target.value)}
                    className={inputClass}
                    placeholder="Example: 2800"
                    inputMode="numeric"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Property Type">
                  <select
                    value={property.propertyType}
                    onChange={(event) =>
                      updateProperty("propertyType", event.target.value as PropertyType)
                    }
                    className={selectClass}
                  >
                    {PROPERTY_TYPES.map((type) => (
                      <option key={type} value={type} className="bg-[#0a0d13]">
                        {type}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Occupied or Empty">
                  <SegmentedControl
                    options={OCCUPANCY_OPTIONS}
                    value={property.occupancy}
                    onChange={(value) => updateProperty("occupancy", value)}
                  />
                </Field>
              </div>

              <Field label="Service Type">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {CLEANING_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateProperty("serviceType", type)}
                      className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                        property.serviceType === type
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/[0.05] text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Notes">
                <textarea
                  value={property.notes}
                  onChange={(event) => updateProperty("notes", event.target.value)}
                  className={inputClass}
                  rows={4}
                  placeholder="Access notes, gate code, staging priorities, timing, sensitive surfaces..."
                />
              </Field>

              <PhotoUploader
                id="property-photos"
                label="Upload property photos"
                scope="property"
                photos={job.propertyPhotos}
                onChange={updatePropertyPhotos}
              />
            </SectionCard>

            <SectionCard
              id="checklist"
              kicker="Step 02"
              title="Walkthrough checklist"
              description="Record condition, notes, photos, and whether each area needs a specialty add-on."
            >
              <div className="grid gap-3">
                {WALKTHROUGH_SECTIONS.map((section) => {
                  const item = checklist[section.id];
                  return (
                    <article
                      key={section.id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-semibold">{section.label}</h3>
                          <p className="mt-1 text-xs leading-5 text-white/45">{section.prompt}</p>
                        </div>
                        <Toggle
                          checked={item.needsAddOn}
                          label="Needs Add-On Service"
                          onChange={(checked) => updateChecklist(section.id, { needsAddOn: checked })}
                        />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                          Condition
                          <select
                            value={item.condition}
                            onChange={(event) =>
                              updateChecklist(section.id, { condition: event.target.value as Condition })
                            }
                            className={selectClass}
                          >
                            {CONDITION_OPTIONS.map((condition) => (
                              <option key={condition} value={condition} className="bg-[#0a0d13]">
                                {condition}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                          Notes
                          <textarea
                            value={item.notes}
                            onChange={(event) => updateChecklist(section.id, { notes: event.target.value })}
                            className={inputClass}
                            rows={2}
                            placeholder={`Notes for ${section.label.toLowerCase()}`}
                          />
                        </label>
                      </div>
                      <div className="mt-3">
                        <PhotoUploader
                          id={`photo-${section.id}`}
                          label={`Add ${section.label.toLowerCase()} photos`}
                          scope={section.id}
                          photos={item.photos}
                          compact
                          onChange={(photos) => updateChecklist(section.id, { photos })}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              id="addons"
              kicker="Step 03"
              title="Add-on selector"
              description="Tap specialty services as the walkthrough reveals scope. Pricing flows into the live estimate."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {ADD_ON_SERVICES.map((service) => {
                  const selected = selectedAddOnSet.has(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleAddOn(service.id)}
                      className={`rounded-[1.5rem] border p-4 text-left transition ${
                        selected
                          ? "border-sky-200/70 bg-sky-200/15 shadow-[0_18px_50px_rgba(56,189,248,0.12)]"
                          : "border-white/10 bg-black/20 hover:border-white/25 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{service.label}</h3>
                          <p className="mt-2 text-xs leading-5 text-white/50">{service.detail}</p>
                        </div>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                            selected
                              ? "border-sky-100 bg-sky-100 text-black"
                              : "border-white/20 text-white/40"
                          }`}
                        >
                          {selected ? "On" : "+"}
                        </span>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-sky-100">
                        {formatRange(service.pricing.min, service.pricing.max)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              id="scope"
              kicker="Step 05"
              title="Generate client scope"
              description="Clean client-facing language that updates with service type, property type, and selected add-ons."
            >
              <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                <p className="text-sm leading-7 text-white/78">{clientScope}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={copyScope}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-sky-100"
                >
                  {scopeCopied ? "Copied" : "Copy scope"}
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/55"
                >
                  Export PDF soon
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/55"
                >
                  Send estimate soon
                </button>
              </div>
            </SectionCard>
          </div>

          <aside id="quote" className="space-y-4 lg:sticky lg:top-6">
            <QuoteCard
              quote={quote}
              serviceType={property.serviceType}
              selectedAddOnCount={selectedAddOnDetails.length}
            />
            <AiReadinessCard
              photoCount={photoCount}
              sectionCount={WALKTHROUGH_SECTIONS.length}
              addOnCount={ADD_ON_SERVICES.length}
            />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050609]/90 px-4 pb-safe pt-3 backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 pb-3">
          <div>
            <p className="text-xs text-white/45">Estimated total</p>
            <p className="text-lg font-semibold">{formatRange(quote.totalLow, quote.totalHigh)}</p>
          </div>
          <a
            href="#scope"
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black no-underline"
          >
            Build scope
          </a>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  id,
  kicker,
  title,
  description,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 rounded-[2rem] border border-white/10 bg-white/[0.065] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/60">{kicker}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
      {label}
      {children}
    </label>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
            value === option ? "bg-white text-black" : "text-white/60 hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] p-1 pr-3 text-left text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/50"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-sky-200" : "bg-white/12"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6 bg-black" : "left-1"
          }`}
        />
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">Add-on</span>
    </button>
  );
}

function PhotoUploader({
  id,
  label,
  scope,
  photos,
  onChange,
  compact = false,
}: {
  id: string;
  label: string;
  scope: PhotoScope;
  photos: WalkthroughPhoto[];
  onChange: (photos: WalkthroughPhoto[]) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.25rem] border border-dashed border-white/14 bg-white/[0.035] ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(event) => onChange([...photos, ...createPhotoAssets(event.target.files, scope)])}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white/80">{label}</p>
          <p className="mt-1 text-xs text-white/40">
            Stored as structured photo records for future AI analysis.
          </p>
        </div>
        <label
          htmlFor={id}
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-sky-100"
        >
          Choose photos
        </label>
      </div>
      {photos.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="max-w-full truncate rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/55"
            >
              {photo.name} - {formatFileSize(photo.size)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AiReadinessCard({
  photoCount,
  sectionCount,
  addOnCount,
}: {
  photoCount: number;
  sectionCount: number;
  addOnCount: number;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/60">
        Future AI layer
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight">Operations OS foundation</h2>
      <p className="mt-2 text-xs leading-5 text-white/45">
        This job is structured for later OpenAI Vision analysis, quote recommendations, scope
        generation, invoice drafting, and photo-based labor estimation.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MetricPill label="Photos" value={photoCount.toString()} />
        <MetricPill label="Sections" value={sectionCount.toString()} />
        <MetricPill label="Add-ons" value={addOnCount.toString()} />
      </div>
    </section>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/35">
        {label}
      </p>
    </div>
  );
}

function QuoteCard({
  quote,
  serviceType,
  selectedAddOnCount,
}: {
  quote: QuoteResult;
  serviceType: CleaningType;
  selectedAddOnCount: number;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.075] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/60">Step 04</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Quote summary</h2>
          <p className="mt-2 text-sm text-white/45">{serviceType} estimate</p>
        </div>
        {quote.luxuryRecommended ? (
          <span className="rounded-full border border-amber-200/30 bg-amber-200/12 px-3 py-2 text-right text-[0.65rem] font-bold uppercase tracking-[0.16em] text-amber-100">
            Luxury Listing Prep Recommended
          </span>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        <QuoteRow label="Base Cleaning Price" value={formatRange(quote.baseLow, quote.baseHigh)} />
        <QuoteRow label={`Add-On Totals (${selectedAddOnCount})`} value={formatRange(quote.addOnLow, quote.addOnHigh)} />
        <QuoteRow label="Estimated Labor Hours" value={`${quote.laborHours.toFixed(1)} hrs`} />
        <QuoteRow label="Suggested Crew Size" value={`${quote.crewSize} ${quote.crewSize === 1 ? "person" : "people"}`} />
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-sky-200/20 bg-sky-200/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/70">Estimated Total</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {formatRange(quote.totalLow, quote.totalHigh)}
        </p>
        <p className="mt-2 text-xs leading-5 text-white/45">
          Internal estimate only. Confirm access, exact scope, supply needs, and crew availability
          before sending final pricing.
        </p>
      </div>
    </section>
  );
}

function QuoteRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm text-white/52">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function roundMoney(value: number) {
  return Math.round(value / 5) * 5;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(roundMoney(value));
}

function formatRange(low: number, high: number) {
  if (roundMoney(low) === roundMoney(high)) {
    return formatCurrency(low);
  }
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

function countJobPhotos(job: WalkthroughJob) {
  return (
    job.propertyPhotos.length +
    Object.values(job.checklist).reduce((total, item) => total + item.photos.length, 0)
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
