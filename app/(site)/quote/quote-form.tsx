"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CORE_SERVICES } from "@/lib/marketing/core-services";
import { submitQuoteRequest } from "@/lib/site/actions/submit-quote-request";
import { QUOTE_ERRORS } from "@/lib/site/quote-submit-types";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

const MORE_SERVICES = [
  "Residential Cleaning",
  "Commercial Cleaning",
  "Pressure Washing / Exterior",
  "Carpet & Steam Cleaning",
  "Trash Can Cleaning",
  "Property Maintenance",
  "Airbnb / Co-host Services",
  "Multiple / Not sure",
] as const;

const CORE_FORM_VALUES = {
  "yard-landscape": "Yard & Landscape Maintenance",
  "window-cleaning": "Window Cleaning",
  "move-out-cleaning": "Move-Out & Turnover Cleaning",
  "trash-debris-removal": "Trash & Debris Removal",
} as const;

const services = [
  ...Object.values(CORE_FORM_VALUES),
  ...MORE_SERVICES,
] as const;

const STEPS = ["Contact", "Property", "Details"] as const;

type QuoteFormProps = {
  defaultService?: string;
};

const inputClass =
  "mt-1.5 w-full min-h-[48px] rounded-xl border border-navy/12 bg-white px-4 py-3 text-base text-charcoal outline-none transition focus:border-ocean focus:ring-2 focus:ring-sky/80";

export function QuoteForm({ defaultService }: QuoteFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [referrer, setReferrer] = useState("");
  const [selectedService, setSelectedService] = useState("");

  useEffect(() => {
    setReferrer(document.referrer || "");
    const match = services.find((s) => s === defaultService) ?? "";
    setSelectedService(match);
  }, [defaultService]);

  function validateStep(current: number): boolean {
    const form = formRef.current;
    if (!form) return false;
    if (current === 0) {
      const name = (form.elements.namedItem("name") as HTMLInputElement)?.value.trim();
      const phone = (form.elements.namedItem("phone") as HTMLInputElement)?.value.trim();
      if (!name || !phone) {
        form.reportValidity();
        return false;
      }
      return true;
    }
    if (current === 1) {
      const service = (form.elements.namedItem("service") as HTMLSelectElement)?.value;
      const address = (form.elements.namedItem("address") as HTMLInputElement)?.value.trim();
      if (!service || !address) {
        form.reportValidity();
        return false;
      }
      return true;
    }
    return true;
  }

  function goNext() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      goNext();
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);
    setPhotoNotice(null);

    const result = await submitQuoteRequest(new FormData(e.currentTarget));

    if (result.ok) {
      if (result.photoWarnings?.length) {
        setPhotoNotice(QUOTE_ERRORS.photosSaved);
      }
      setStatus("success");
      e.currentTarget.reset();
      setStep(0);
      setSelectedService("");
      return;
    }

    setStatus("error");
    setErrorMessage(result.error);
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-leaf/25 bg-white p-8 shadow-luxury">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-leaf/15 text-xl text-leaf">
          ✓
        </div>
        <h2 className="mt-5 text-xl font-semibold text-navy">You&apos;re all set</h2>
        <p className="mt-3 text-sm leading-relaxed text-charcoal/75">
          We received your request and will follow up shortly. Urgent? Call{" "}
          <a href={PHONE_TEL} className="font-semibold text-ocean no-underline hover:underline">
            {PHONE_DISPLAY}
          </a>
          .
        </p>
        {photoNotice ? (
          <p className="mt-4 rounded-xl bg-sky/40 px-4 py-3 text-sm text-navy">{photoNotice}</p>
        ) : null}
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-secondary mt-6 w-full sm:w-auto"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="overflow-hidden rounded-3xl border border-navy/[0.08] bg-white shadow-luxury"
    >
      <input type="hidden" name="source" value="website" />
      <input type="hidden" name="referrer" value={referrer} />

      <div className="border-b border-navy/[0.06] bg-cream/50 px-6 py-5 sm:px-8">
        <div className="flex gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-1 flex-col gap-2">
              <div
                className={`h-1 rounded-full transition-colors duration-300 ${
                  i <= step ? "bg-ocean" : "bg-navy/10"
                }`}
              />
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  i === step ? "text-ocean" : "text-charcoal/40"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-6 py-6 sm:px-8 sm:py-8">
        {step === 0 ? (
          <>
            <div>
              <h2 className="text-lg font-semibold text-navy">How should we reach you?</h2>
              <p className="mt-1 text-sm text-charcoal/60">We typically reply same day.</p>
            </div>
            <label className="block text-sm font-medium text-navy">
              Name
              <input required name="name" autoComplete="name" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-navy">
              Phone
              <input required name="phone" type="tel" autoComplete="tel" className={inputClass} />
            </label>
            <label className="block text-sm font-medium text-navy">
              Email <span className="font-normal text-charcoal/50">(optional)</span>
              <input name="email" type="email" autoComplete="email" className={inputClass} />
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-navy">Preferred contact</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["Call", "Text", "Email"] as const).map((method) => (
                  <label
                    key={method}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-navy/12 px-4 py-2 text-sm has-[:checked]:border-ocean has-[:checked]:bg-sky/30"
                  >
                    <input
                      type="radio"
                      name="contact"
                      value={method}
                      defaultChecked={method === "Call"}
                      className="sr-only"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div>
              <h2 className="text-lg font-semibold text-navy">What do you need?</h2>
              <p className="mt-1 text-sm text-charcoal/60">Pick a service and where the work is.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CORE_SERVICES.map((core) => {
                const serviceName = CORE_FORM_VALUES[core.slug as keyof typeof CORE_FORM_VALUES];
                const active = selectedService === serviceName;
                return (
                  <button
                    key={core.slug}
                    type="button"
                    onClick={() => setSelectedService(serviceName)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-ocean bg-sky/40 text-navy"
                        : "border-navy/12 bg-white text-charcoal/70 hover:border-ocean/40"
                    }`}
                  >
                    {core.name}
                  </button>
                );
              })}
            </div>
            <label className="block text-sm font-medium text-navy">
              Service
              <select
                required
                name="service"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-navy">
              Property address
              <input
                required
                name="address"
                autoComplete="street-address"
                placeholder="Street address"
                className={inputClass}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-navy">
                City
                <input name="city" placeholder="West Palm Beach" className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-navy">
                Property type
                <select name="propertyType" className={inputClass}>
                  <option value="">Select…</option>
                  <option value="Single-family home">Single-family home</option>
                  <option value="Condo / Townhome">Condo / Townhome</option>
                  <option value="Airbnb / Short-term rental">Airbnb / STR</option>
                  <option value="Commercial / Retail">Commercial</option>
                  <option value="HOA / Common areas">HOA</option>
                  <option value="Other">Other</option>
                </select>
              </label>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div>
              <h2 className="text-lg font-semibold text-navy">Anything else?</h2>
              <p className="mt-1 text-sm text-charcoal/60">Photos help us quote faster and accurately.</p>
            </div>
            <label className="block text-sm font-medium text-navy">
              Details
              <textarea
                name="message"
                rows={3}
                placeholder="Timing, access notes, size of job…"
                className={`${inputClass} min-h-[96px] resize-y`}
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-navy">
                Preferred date
                <input name="preferredDate" type="date" className={inputClass} />
              </label>
              <label className="block text-sm font-medium text-navy">
                Preferred time
                <input name="preferredTime" placeholder="Morning, after 2pm…" className={inputClass} />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-navy">Photos</span>
              <span className="ml-1 text-sm font-normal text-charcoal/50">(up to 5)</span>
              <div className="mt-2 rounded-2xl border-2 border-dashed border-navy/15 bg-cream/40 px-4 py-6 text-center">
                <input
                  name="photos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  multiple
                  className="mx-auto w-full max-w-xs text-sm text-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-ocean file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream"
                />
              </div>
            </label>
          </>
        ) : null}

        {errorMessage ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-navy/[0.06] px-6 py-5 sm:flex-row sm:justify-between sm:px-8">
        {step > 0 ? (
          <button type="button" onClick={goBack} className="btn-secondary min-h-[48px] sm:min-w-[120px]">
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary-lg min-h-[52px] w-full sm:w-auto sm:min-w-[160px] disabled:opacity-70"
        >
          {status === "submitting" ? (
            "Sending…"
          ) : step < STEPS.length - 1 ? (
            "Continue"
          ) : (
            "Submit request"
          )}
        </button>
      </div>

      <p className="border-t border-navy/[0.04] px-6 py-4 text-center text-xs text-charcoal/55 sm:px-8">
        Your info stays with {SITE_NAME} for quoting and scheduling only.
      </p>
    </form>
  );
}
