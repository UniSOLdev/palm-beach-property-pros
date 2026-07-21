"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { submitQuoteRequest } from "@/lib/site/actions/submit-quote-request";
import { needsWaterSpigotQuestion } from "@/lib/site/quote-form-utils";
import { QUOTE_ERRORS } from "@/lib/site/quote-submit-types";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

type ServiceOption = { slug: string; title: string };

type QuoteFormProps = {
  services: ServiceOption[];
  defaultService?: string;
};

export function QuoteForm({ services, defaultService }: QuoteFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [referrer, setReferrer] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    setReferrer(document.referrer || "");
  }, []);

  useEffect(() => {
    if (!defaultService) return;
    const match = services.find(
      (s) => s.title === defaultService || s.slug === defaultService,
    );
    if (match) setSelectedServices([match.title]);
  }, [defaultService, services]);

  const showWaterSpigot = useMemo(
    () => needsWaterSpigotQuestion(selectedServices),
    [selectedServices],
  );

  function toggleService(title: string) {
    setSelectedServices((prev) =>
      prev.includes(title) ? prev.filter((s) => s !== title) : [...prev, title],
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedServices.length) {
      setErrorMessage("Select at least one service.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);
    setPhotoNotice(null);

    const formData = new FormData(e.currentTarget);
    selectedServices.forEach((s) => formData.append("services", s));

    const result = await submitQuoteRequest(formData);

    if (result.ok) {
      if (result.photoWarnings?.length) {
        setPhotoNotice(QUOTE_ERRORS.photosSaved);
      }
      setStatus("success");
      setSelectedServices([]);
      e.currentTarget.reset();
      return;
    }

    setStatus("error");
    setErrorMessage(result.error);
  }

  if (status === "success") {
    return (
      <div className="space-y-4 rounded-xl border border-leaf/30 bg-white p-6 shadow-md sm:p-8">
        <h2 className="text-xl font-bold text-navy">Request received</h2>
        <p className="text-sm leading-relaxed text-charcoal/85">
          Thank you for reaching out to {SITE_NAME}. We will review your details and follow up using
          your preferred contact method. For urgent scheduling, call{" "}
          <a href={PHONE_TEL} className="font-semibold text-ocean no-underline hover:underline">
            {PHONE_DISPLAY}
          </a>
          .
        </p>
        <p className="text-xs text-charcoal/60">
          Your request is in our system and will appear in our leads queue immediately.
        </p>
        {photoNotice ? (
          <p className="rounded-xl bg-sky/50 px-4 py-3 text-sm text-navy">{photoNotice}</p>
        ) : null}
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="btn-secondary px-5 py-2.5 text-sm"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="space-y-5 rounded-xl border border-navy/10 bg-white p-6 shadow-md sm:p-8"
    >
      <input type="hidden" name="source" value="website" />
      <input type="hidden" name="referrer" value={referrer} />
      {/* Honeypot — hidden from users */}
      <input
        type="text"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden
      />

      <p className="text-sm text-charcoal/85">
        Select one or more services, share property details, and upload photos for the fastest
        scope-based estimate.
      </p>

      <fieldset>
        <legend className="text-sm font-medium text-navy">
          Services needed <span className="text-red-600">*</span>
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.slug}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${
                selectedServices.includes(s.title)
                  ? "border-ocean bg-sky/40 text-navy"
                  : "border-navy/15 bg-cream text-charcoal"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(s.title)}
                onChange={() => toggleService(s.title)}
                className="h-4 w-4 accent-ocean"
              />
              {s.title}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Name <span className="text-red-600">*</span>
          <input
            required
            name="name"
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Phone <span className="text-red-600">*</span>
          <input
            required
            name="phone"
            type="tel"
            autoComplete="tel"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-navy">
        Email <span className="font-normal text-charcoal/60">(optional)</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
        />
      </label>

      <label className="block text-sm font-medium text-navy">
        Property address / city <span className="text-red-600">*</span>
        <input
          required
          name="address"
          autoComplete="street-address"
          placeholder="Street address or property location"
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          City
          <input
            name="city"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Property type
          <select
            name="propertyType"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          >
            <option value="">Select…</option>
            <option value="Single-family home">Single-family home</option>
            <option value="Condo / Townhome">Condo / Townhome</option>
            <option value="Airbnb / Short-term rental">Airbnb / Short-term rental</option>
            <option value="Commercial / Retail">Commercial / Retail</option>
            <option value="Office">Office</option>
            <option value="HOA / Common areas">HOA / Common areas</option>
            <option value="Other">Other</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-navy">
        Scope notes
        <textarea
          name="message"
          rows={4}
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          placeholder="Square footage, pane counts, stains, access constraints, timing…"
        />
      </label>

      {showWaterSpigot ? (
        <fieldset>
          <legend className="text-sm font-medium text-navy">
            Is an accessible exterior water spigot available? <span className="text-red-600">*</span>
          </legend>
          <p className="mt-1 text-xs text-charcoal/70">
            PBPP normally connects to your exterior spigot. Alternate water arrangements may require
            an additional charge.
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-charcoal">
            <label className="inline-flex min-h-[44px] items-center gap-2">
              <input type="radio" name="waterSpigot" value="yes" required />
              Yes
            </label>
            <label className="inline-flex min-h-[44px] items-center gap-2">
              <input type="radio" name="waterSpigot" value="no" required />
              No
            </label>
            <label className="inline-flex min-h-[44px] items-center gap-2">
              <input type="radio" name="waterSpigot" value="unsure" required />
              Unsure
            </label>
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Preferred date <span className="font-normal text-charcoal/60">(optional)</span>
          <input
            name="preferredDate"
            type="date"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Preferred contact method
          <select
            name="contact"
            defaultValue="Call"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          >
            <option value="Call">Call</option>
            <option value="Text">Text</option>
            <option value="Email">Email</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-navy">
        Photos <span className="font-normal text-charcoal/60">(optional, up to 5, max 10MB each)</span>
        <input
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-sm text-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-sky/60 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy"
        />
      </label>

      {errorMessage ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary-lg w-full disabled:opacity-70"
        aria-busy={status === "submitting"}
      >
        {status === "submitting" ? "Submitting…" : "Request a Free Estimate"}
      </button>

      <p className="text-center text-xs text-charcoal/70">
        Free estimates • Photo uploads • Clear communication
      </p>
    </form>
  );
}
