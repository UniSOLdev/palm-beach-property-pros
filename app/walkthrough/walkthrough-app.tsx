"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ADD_ON_SERVICES,
  CLEANING_TYPES,
  CONDITION_OPTIONS,
  LABOR_COMPLEXITY_OPTIONS,
  OCCUPANCY_OPTIONS,
  PROPERTY_TYPES,
  TURNAROUND_OPTIONS,
  WALKTHROUGH_SECTIONS,
} from "@/lib/walkthrough/config";
import { generatePropertyInsights } from "@/lib/walkthrough/insights";
import type { PropertyInsights } from "@/lib/walkthrough/insights";
import {
  createPhotoAssets,
  createWalkthroughJob,
  createVoiceMemo,
  getTaggedPhotoCount,
  normalizeWalkthroughJob,
  touchJob,
} from "@/lib/walkthrough/job";
import { calculateWalkthroughQuote, getSelectedAddOns } from "@/lib/walkthrough/quote-engine";
import { generateClientScope } from "@/lib/walkthrough/scope";
import type {
  AddOnId,
  ChecklistItem,
  CleaningType,
  EstimateViewMode,
  PhotoTag,
  PropertyIntake,
  PropertyType,
  QuoteResult,
  WalkthroughJob,
  WalkthroughPhoto,
  WalkthroughSectionId,
} from "@/lib/walkthrough/types";

const steps = [
  { id: "intake", label: "Intake" },
  { id: "photos", label: "Photos" },
  { id: "condition-pass", label: "Condition" },
  { id: "addons", label: "Add-ons" },
  { id: "quote", label: "Quote" },
  { id: "scope", label: "Scope" },
] as const;

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-base text-white outline-none transition placeholder:text-white/35 focus:border-sky-300/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-sky-400/10";

const selectClass = `${inputClass} appearance-none`;
const storageKey = "pbpp.walkthrough.currentJob.v1";

export function WalkthroughApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [accessError, setAccessError] = useState("");
  const [job, setJob] = useState<WalkthroughJob>(() => loadStoredJob());
  const [saveStatus, setSaveStatus] = useState("Autosaved locally");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [expandedPhoto, setExpandedPhoto] = useState<WalkthroughPhoto | null>(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [scopeCopied, setScopeCopied] = useState(false);

  const { property, checklist } = job;
  const selectedAddOns = job.selectedAddOnIds;
  const selectedAddOnSet = useMemo(() => new Set(selectedAddOns), [selectedAddOns]);
  const selectedAddOnDetails = useMemo(
    () => getSelectedAddOns(job.selectedAddOnIds),
    [job.selectedAddOnIds],
  );
  const photoCount = countJobPhotos(job);
  const completedSectionCount = WALKTHROUGH_SECTIONS.filter(
    (section) => checklist[section.id].completed,
  ).length;
  const progressPercent = Math.round((completedSectionCount / WALKTHROUGH_SECTIONS.length) * 100);

  const quote = useMemo(() => calculateWalkthroughQuote(job), [job]);

  const clientScope = useMemo(() => generateClientScope(job, quote), [job, quote]);
  const insights = useMemo(() => generatePropertyInsights(job, quote), [job, quote]);
  const selectedViewMode = job.estimateViewMode;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(job));
        setSaveStatus("Saved locally");
      } catch {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(stripPhotoPreviews(job)));
          setSaveStatus("Saved metadata");
        } catch {
          setSaveStatus("Autosave limited");
        }
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [job]);

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

  function toggleSectionComplete(sectionId: WalkthroughSectionId) {
    updateChecklist(sectionId, { completed: !job.checklist[sectionId].completed });
  }

  function toggleSectionCollapse(sectionId: WalkthroughSectionId) {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }));
  }

  function updatePropertyPhotos(photos: WalkthroughPhoto[]) {
    updateJob((current) => ({
      ...current,
      propertyPhotos: photos,
    }));
  }

  function removePropertyPhoto(photoId: string) {
    updatePropertyPhotos(job.propertyPhotos.filter((photo) => photo.id !== photoId));
  }

  async function addBulkPhotos(files: FileList | null) {
    setPhotoUploadStatus("processing");
    const nextPhotos = await createPhotoAssets(files, "property");
    updatePropertyPhotos([...job.propertyPhotos, ...nextPhotos]);
    setPhotoUploadStatus("ready");
    window.setTimeout(() => setPhotoUploadStatus("idle"), 1200);
  }

  function togglePhotoTag(photoId: string, tag: PhotoTag) {
    updatePropertyPhotos(
      job.propertyPhotos.map((photo) => {
        if (photo.id !== photoId) {
          return photo;
        }

        return {
          ...photo,
          tags: photo.tags.includes(tag)
            ? photo.tags.filter((item) => item !== tag)
            : [...photo.tags, tag],
        };
      }),
    );
  }

  function updateVoiceMemo(sectionId: WalkthroughSectionId) {
    updateChecklist(sectionId, { voiceMemo: createVoiceMemo(sectionId) });
  }

  function removeVoiceMemo(sectionId: WalkthroughSectionId) {
    updateChecklist(sectionId, { voiceMemo: undefined });
  }

  function updateEstimateViewMode(mode: EstimateViewMode) {
    updateJob((current) => ({
      ...current,
      estimateViewMode: mode,
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
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs text-white/45">
              <span>{completedSectionCount}/{WALKTHROUGH_SECTIONS.length} sections complete</span>
              <span>{saveStatus}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-200 via-white to-emerald-200 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Quick jump navigation">
            <a
              href="#intake"
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/70 no-underline transition hover:border-sky-300/40 hover:text-white"
            >
              Intake
            </a>
            <a
              href="#photos"
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/70 no-underline transition hover:border-sky-300/40 hover:text-white"
            >
              Photos
            </a>
            {WALKTHROUGH_SECTIONS.map((section) => {
              const complete = checklist[section.id].completed;
              return (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold no-underline transition ${
                    complete
                      ? "border-emerald-200/30 bg-emerald-200/12 text-emerald-100"
                      : "border-white/10 bg-white/[0.06] text-white/70 hover:border-sky-300/40 hover:text-white"
                  }`}
                >
                  {complete ? "Done " : ""}
                  {section.label}
                </a>
              );
            })}
            {steps.slice(3).map((step) => (
              <a
                key={step.id}
                href={`#${step.id}`}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/70 no-underline transition hover:border-sky-300/40 hover:text-white"
              >
                {step.label}
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

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Field label="Beds">
                  <input
                    value={property.roomCounts.bedrooms}
                    onChange={(event) =>
                      updateProperty("roomCounts", {
                        ...property.roomCounts,
                        bedrooms: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="4"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Baths">
                  <input
                    value={property.roomCounts.bathrooms}
                    onChange={(event) =>
                      updateProperty("roomCounts", {
                        ...property.roomCounts,
                        bathrooms: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="3.5"
                    inputMode="decimal"
                  />
                </Field>
                <Field label="Kitchens">
                  <input
                    value={property.roomCounts.kitchens}
                    onChange={(event) =>
                      updateProperty("roomCounts", {
                        ...property.roomCounts,
                        kitchens: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="1"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Living">
                  <input
                    value={property.roomCounts.livingAreas}
                    onChange={(event) =>
                      updateProperty("roomCounts", {
                        ...property.roomCounts,
                        livingAreas: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="2"
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Levels">
                  <input
                    value={property.roomCounts.levels}
                    onChange={(event) =>
                      updateProperty("roomCounts", {
                        ...property.roomCounts,
                        levels: event.target.value,
                      })
                    }
                    className={inputClass}
                    placeholder="1"
                    inputMode="numeric"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Labor Complexity">
                  <SegmentedControl
                    options={LABOR_COMPLEXITY_OPTIONS}
                    value={property.laborComplexity}
                    onChange={(value) => updateProperty("laborComplexity", value)}
                  />
                </Field>
                <Field label="Turnaround">
                  <SegmentedControl
                    options={TURNAROUND_OPTIONS}
                    value={property.turnaround}
                    onChange={(value) => updateProperty("turnaround", value)}
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

            </SectionCard>

            <SectionCard
              id="photos"
              kicker="Step 02"
              title="Bulk walkthrough photo intake"
              description="Upload once, then optionally tag only the photos that matter. Camera roll and live capture are both supported by the device picker."
            >
              <BulkPhotoIntake
                photos={job.propertyPhotos}
                uploadStatus={photoUploadStatus}
                onAddPhotos={addBulkPhotos}
                onRemove={removePropertyPhoto}
                onExpand={setExpandedPhoto}
                onToggleTag={togglePhotoTag}
              />
            </SectionCard>

            <SectionCard
              id="condition-pass"
              kicker="Step 03"
              title="Room / area condition pass"
              description="Fast one-tap condition, add-on flags, voice memo placeholders, and completion status. Photos remain centralized."
            >
              <div className="grid gap-3">
                {WALKTHROUGH_SECTIONS.map((section) => {
                  const item = checklist[section.id];
                  const collapsed = collapsedSections[section.id] ?? item.completed;
                  const taggedCount = getTaggedPhotoCount(job.propertyPhotos, section.id);
                  return (
                    <article
                      id={`section-${section.id}`}
                      key={section.id}
                      className={`scroll-mt-40 rounded-[1.5rem] border p-4 transition ${
                        item.completed
                          ? "border-emerald-200/25 bg-emerald-200/[0.07]"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleSectionCollapse(section.id)}
                          className="min-h-12 flex-1 text-left"
                          aria-expanded={!collapsed}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                item.completed ? "bg-emerald-200" : "bg-white/25"
                              }`}
                            />
                            <h3 className="text-base font-semibold">{section.label}</h3>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-white/45">{section.prompt}</p>
                          {taggedCount > 0 ? (
                            <p className="mt-2 inline-flex rounded-full border border-sky-200/20 bg-sky-200/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-sky-100">
                              {section.label.toUpperCase()} - {taggedCount} photos attached
                            </p>
                          ) : null}
                        </button>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Toggle
                            checked={item.needsAddOn}
                            label="Needs Add-On Service"
                            onChange={(checked) => updateChecklist(section.id, { needsAddOn: checked })}
                          />
                          <button
                            type="button"
                            onClick={() => toggleSectionComplete(section.id)}
                            className={`rounded-full border px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] transition ${
                              item.completed
                                ? "border-emerald-200/40 bg-emerald-200/15 text-emerald-100"
                                : "border-white/10 bg-white/[0.05] text-white/55"
                            }`}
                          >
                            {item.completed ? "Complete" : "Mark done"}
                          </button>
                        </div>
                      </div>
                      {!collapsed ? (
                        <div className="mt-4">
                          <div className="grid gap-3 sm:grid-cols-[260px_minmax(0,1fr)]">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                                Condition
                              </p>
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                {CONDITION_OPTIONS.map((condition) => (
                                  <button
                                    key={condition}
                                    type="button"
                                    onClick={() => updateChecklist(section.id, { condition })}
                                    className={`min-h-12 rounded-2xl border px-3 text-sm font-semibold transition ${
                                      item.condition === condition
                                        ? "border-white bg-white text-black"
                                        : "border-white/10 bg-white/[0.05] text-white/62"
                                    }`}
                                  >
                                    {condition}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                              Notes
                              <textarea
                                value={item.notes}
                                onChange={(event) =>
                                  updateChecklist(section.id, { notes: event.target.value })
                                }
                                className={inputClass}
                                rows={2}
                                placeholder={`Notes for ${section.label.toLowerCase()}`}
                              />
                            </label>
                          </div>
                          <VoiceMemoControl
                            voiceMemo={item.voiceMemo}
                            onRecord={() => updateVoiceMemo(section.id)}
                            onRemove={() => removeVoiceMemo(section.id)}
                          />
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              id="addons"
              kicker="Step 04"
              title="Add-on recommendations"
              description="Tap specialty services as the walkthrough reveals scope. Future AI suggestions will appear in this same layer."
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
              kicker="Step 06"
              title="Generate client scope"
              description="Clean client-facing language that updates with service type, property type, and selected add-ons."
            >
              <div className="grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                {(["internal", "client"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateEstimateViewMode(mode)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold capitalize transition ${
                      selectedViewMode === mode ? "bg-white text-black" : "text-white/60"
                    }`}
                  >
                    {mode === "internal" ? "Internal Ops View" : "Client Estimate View"}
                  </button>
                ))}
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                {selectedViewMode === "internal" ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                      Internal ops context
                    </p>
                    <p className="text-sm leading-7 text-white/78">{clientScope}</p>
                    <ul className="space-y-2">
                      {quote.internalNotes.map((note) => (
                        <li key={note} className="rounded-2xl bg-white/[0.04] p-3 text-xs text-white/55">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-white/78">{clientScope}</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-5">
                <button
                  type="button"
                  className="rounded-2xl border border-sky-200/20 bg-sky-200/10 px-4 py-3 text-sm font-semibold text-sky-50"
                >
                  Generate Client Scope
                </button>
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
                  Generate Invoice
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/55"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white/55"
                >
                  Save Walkthrough
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
            <PropertyInsightsCard insights={insights} />
            <AiReadinessCard
              photoCount={photoCount}
              sectionCount={WALKTHROUGH_SECTIONS.length}
              addOnCount={ADD_ON_SERVICES.length}
            />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#050609]/92 px-4 pb-safe pt-3 shadow-[0_-20px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 pb-3">
          <div>
            <p className="text-xs text-white/45">
              {quote.difficultyRating} - {quote.pricingConfidence} confidence
            </p>
            <p className="text-lg font-semibold">{formatRange(quote.totalLow, quote.totalHigh)}</p>
            <p className="text-xs text-white/40">{quote.estimatedDuration}</p>
          </div>
          <a
            href="#scope"
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black no-underline"
          >
            Build scope
          </a>
        </div>
      </div>
      {expandedPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-xl">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close photo preview"
            onClick={() => setExpandedPhoto(null)}
          />
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#090b10] shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
            <button
              type="button"
              onClick={() => setExpandedPhoto(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
            >
              Close
            </button>
            <div className="relative aspect-[4/5] max-h-[80vh] w-full">
              {expandedPhoto.previewUrl ? (
                <Image
                  src={expandedPhoto.previewUrl}
                  alt={expandedPhoto.name}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="border-t border-white/10 p-4">
              <p className="font-semibold">{expandedPhoto.name}</p>
              <p className="mt-1 text-xs text-white/45">
                {expandedPhoto.tags.length > 0
                  ? expandedPhoto.tags.map(getTagLabel).join(", ")
                  : "No tags yet"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
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
    <div
      className={`mt-2 grid rounded-2xl border border-white/10 bg-white/[0.04] p-1 ${
        options.length === 3 ? "grid-cols-3" : "grid-cols-2"
      }`}
    >
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

function VoiceMemoControl({
  voiceMemo,
  onRecord,
  onRemove,
}: {
  voiceMemo: ChecklistItem["voiceMemo"];
  onRecord: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
            Voice note
          </p>
          <p className="mt-1 text-sm text-white/70">
            {voiceMemo ? `${voiceMemo.label} - ${voiceMemo.durationLabel}` : "Tap to attach a memo placeholder"}
          </p>
        </div>
        {voiceMemo ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/70"
            >
              Play
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="min-h-11 rounded-2xl border border-red-200/20 bg-red-300/10 px-4 text-sm font-semibold text-red-100"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRecord}
            className="min-h-11 rounded-2xl bg-white px-4 text-sm font-semibold text-black"
          >
            Record
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-white/35">
        Future-ready for transcription, AI scope generation, and photo/context matching.
      </p>
    </div>
  );
}

function BulkPhotoIntake({
  photos,
  uploadStatus,
  onAddPhotos,
  onRemove,
  onExpand,
  onToggleTag,
}: {
  photos: WalkthroughPhoto[];
  uploadStatus: "idle" | "processing" | "ready";
  onAddPhotos: (files: FileList | null) => void;
  onRemove: (photoId: string) => void;
  onExpand: (photo: WalkthroughPhoto) => void;
  onToggleTag: (photoId: string, tag: PhotoTag) => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/14 bg-white/[0.035] p-4">
      <input
        id="bulk-walkthrough-photos"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          onAddPhotos(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold text-white">
            {photos.length} {photos.length === 1 ? "walkthrough photo" : "walkthrough photos"}
          </p>
          <p className="mt-1 text-xs text-white/40">
            Use the iPhone picker for camera roll or live capture. No forced camera mode.
          </p>
          {uploadStatus !== "idle" ? (
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100">
              {uploadStatus === "processing" ? "Processing image previews..." : "Photos ready"}
            </p>
          ) : null}
        </div>
        <label
          htmlFor="bulk-walkthrough-photos"
          className="inline-flex min-h-14 cursor-pointer items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-black transition hover:bg-sky-100"
        >
          Add photos
        </label>
      </div>
      {photos.length > 0 ? (
        <ul className="mt-5 columns-2 gap-2 sm:columns-3 lg:columns-4">
          {photos.map((photo) => (
            <li key={photo.id} className="relative mb-2 break-inside-avoid overflow-hidden rounded-2xl bg-black/30">
              <button
                type="button"
                onClick={() => onExpand(photo)}
                className="group relative block w-full overflow-hidden text-left"
              >
                <div className="relative aspect-[4/5] w-full">
                  {photo.previewUrl ? (
                    <Image
                      src={photo.previewUrl}
                      alt={photo.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover opacity-0 transition duration-500 group-hover:scale-[1.03]"
                      onLoadingComplete={(image) => image.classList.remove("opacity-0")}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-white/[0.06] text-xs text-white/35">
                      Image
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="truncate text-[0.65rem] font-medium text-white">{photo.name}</p>
                    <p className="text-[0.6rem] text-white/55">{formatFileSize(photo.size)}</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-sm font-semibold text-white backdrop-blur transition hover:bg-red-500"
                aria-label={`Remove ${photo.name}`}
              >
                x
              </button>
              <div className="space-y-2 p-2">
                <div className="flex flex-wrap gap-1">
                  {photo.tags.length > 0 ? (
                    photo.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-sky-200/10 px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-sky-100"
                      >
                        {getTagLabel(tag)}
                      </span>
                    ))
                  ) : (
                    <span className="text-[0.65rem] text-white/35">Optional tags</span>
                  )}
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[...WALKTHROUGH_SECTIONS.map((section) => section.id), "other" as const].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleTag(photo.id, tag)}
                      className={`shrink-0 rounded-full px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] transition ${
                        photo.tags.includes(tag)
                          ? "bg-white text-black"
                          : "bg-white/[0.06] text-white/45"
                      }`}
                    >
                      {getTagLabel(tag)}
                    </button>
                  ))}
                </div>
              </div>
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
        This job is structured for later OpenAI Vision analysis, automatic room detection,
        stain/scuff detection, AI scope generation, invoice drafting, upsell suggestions, and
        photo-based labor estimation.
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

function PropertyInsightsCard({ insights }: { insights: PropertyInsights }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/60">
        Property intelligence
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight">{insights.jobDifficulty}</h2>
      <div className="mt-4 space-y-4">
        <InsightList title="Likely supplies" items={insights.supplyRequirements} />
        <InsightList title="Arrival setup" items={insights.arrivalSetup} />
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
            Crew configuration
          </p>
          <p className="mt-2 text-sm leading-5 text-white/70">{insights.crewConfiguration}</p>
          <p className="mt-2 text-sm font-semibold text-sky-100">{insights.timeOnSite}</p>
        </div>
      </div>
    </section>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/62">
            {item}
          </li>
        ))}
      </ul>
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
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200/60">Step 05</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Quote summary</h2>
          <p className="mt-2 text-sm text-white/45">{serviceType} estimate</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-right text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/55">
          {quote.pricingConfidence} confidence
        </span>
      </div>

      {quote.badges.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {quote.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-amber-200/30 bg-amber-200/12 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-amber-100"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        <QuoteRow label="Base Scope" value={serviceType} />
        <QuoteRow label="Base Cleaning Price" value={formatRange(quote.baseLow, quote.baseHigh)} />
        <QuoteRow label={`Add-On Totals (${selectedAddOnCount})`} value={formatRange(quote.addOnLow, quote.addOnHigh)} />
        <QuoteRow label="Estimated Labor Hours" value={`${quote.laborHours.toFixed(1)} hrs`} />
        <QuoteRow label="Suggested Crew Size" value={`${quote.crewSize} ${quote.crewSize === 1 ? "person" : "people"}`} />
        <QuoteRow label="Estimated Duration" value={quote.estimatedDuration} />
        <QuoteRow label="Difficulty" value={quote.difficultyRating} />
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
      <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
          Internal notes
        </p>
        <ul className="mt-3 space-y-2">
          {quote.internalNotes.map((note) => (
            <li key={note} className="text-xs leading-5 text-white/55">
              {note}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["Generate Client Scope", "Copy Scope", "Generate Invoice", "Export PDF", "Save Walkthrough"].map((action) => (
          <a
            key={action}
            href={action === "Generate Client Scope" || action === "Copy Scope" ? "#scope" : "#quote"}
            className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 text-center text-xs font-semibold text-white/65 no-underline transition hover:border-white/25 hover:text-white"
          >
            {action}
          </a>
        ))}
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
  return job.propertyPhotos.length;
}

function loadStoredJob() {
  if (typeof window === "undefined") {
    return createWalkthroughJob();
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? normalizeWalkthroughJob(JSON.parse(stored)) : createWalkthroughJob();
  } catch {
    return createWalkthroughJob();
  }
}

function stripPhotoPreviews(job: WalkthroughJob): WalkthroughJob {
  return {
    ...job,
    propertyPhotos: job.propertyPhotos.map((photo) => ({
      ...photo,
      previewUrl: undefined,
    })),
  };
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getTagLabel(tag: PhotoTag) {
  if (tag === "other") {
    return "Other";
  }

  return WALKTHROUGH_SECTIONS.find((section) => section.id === tag)?.label ?? tag;
}
