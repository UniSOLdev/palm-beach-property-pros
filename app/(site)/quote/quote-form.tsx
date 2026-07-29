"use client";

import { FormEvent, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { submitQuoteRequest } from "@/lib/site/actions/submit-quote-request";
import { QUOTE_ERRORS } from "@/lib/site/quote-submit-types";
import { CTA } from "@/lib/cta";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

const services = [
  "Window Cleaning",
  "Residential Cleaning",
  "Commercial Cleaning",
  "Pressure Washing / Exterior",
  "Property & Estate Care",
  "Vacation Home Checks",
  "Mobile Detailing",
  "Auto Detailing",
  "Carpet & Steam Cleaning",
  "Trash Can Cleaning",
  "Property Maintenance",
  "Airbnb / Co-host Services",
  "Multiple / Not sure",
] as const;

type QuoteFormProps = {
  defaultService?: string;
};

export function QuoteForm({ defaultService }: QuoteFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [referrer, setReferrer] = useState("");

  useEffect(() => {
    setReferrer(document.referrer || "");
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);
    setPhotoNotice(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitQuoteRequest(formData);

    if (result.ok) {
      trackEvent("estimate_form_submit", {
        service: String(formData.get("service") ?? ""),
        source: String(formData.get("source") ?? "website"),
      });
      if (result.photoWarnings?.length) {
        console.warn("[PBPP Quote] submitted with photo warnings:", result.photoWarnings);
        setPhotoNotice(QUOTE_ERRORS.photosSaved);
      }
      setStatus("success");
      e.currentTarget.reset();
      return;
    }

    console.error("[PBPP Quote] submit failed:", {
      code: result.code,
      error: result.error,
      ...(process.env.NODE_ENV === "development" && "debug" in result
        ? { debug: result.debug }
        : {}),
    });

    setStatus("error");
    setErrorMessage(result.error);
  }

  if (status === "success") {
    return (
      <div
        className="space-y-4 rounded-xl border border-leaf/30 bg-white p-6 shadow-md sm:p-8"
        role="status"
        aria-live="polite"
      >
        <h2 className="text-xl font-bold text-navy">Thank you</h2>
        <p className="text-sm leading-relaxed text-charcoal/85">
          Thank you. We received your request and will call or text you to confirm the details and
          next steps. For urgent scheduling, call{" "}
          <a href={PHONE_TEL} className="font-semibold text-ocean no-underline hover:underline">
            {PHONE_DISPLAY}
          </a>
          .
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

  const matchedService = services.find((s) => s === defaultService) ?? "";

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="space-y-5 rounded-xl border border-navy/10 bg-white p-6 shadow-md sm:p-8"
      noValidate
    >
      <input type="hidden" name="source" value="website" />
      <input type="hidden" name="referrer" value={referrer} />
      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Do not fill this out
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <p className="text-sm text-charcoal/85">
        Share your property details below. Photos help us provide accurate estimates—we will follow
        up by call or text.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Name <span className="text-red-600">*</span>
          <input
            required
            name="name"
            autoComplete="name"
            aria-required="true"
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
            aria-required="true"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-navy">
        Email <span className="text-red-600">*</span>
        <input
          required
          name="email"
          type="email"
          autoComplete="email"
          aria-required="true"
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Service needed <span className="text-red-600">*</span>
        <select
          required
          name="service"
          defaultValue={matchedService}
          aria-required="true"
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
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
        City or ZIP code <span className="text-red-600">*</span>
        <input
          required
          name="city"
          autoComplete="address-level2 postal-code"
          placeholder="e.g. West Palm Beach or 33401"
          aria-required="true"
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
        />
      </label>
      <label className="block text-sm font-medium text-navy">
        Property address <span className="font-normal text-charcoal/60">(optional)</span>
        <input
          name="address"
          autoComplete="street-address"
          placeholder="Street address or cross-street"
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
      <label className="block text-sm font-medium text-navy">
        Project description <span className="text-red-600">*</span>
        <textarea
          required
          name="message"
          rows={4}
          aria-required="true"
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          placeholder="What do you need done? Include square footage, number of windows, timing, or access notes…"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Preferred timing <span className="font-normal text-charcoal/60">(optional)</span>
          <input
            name="preferredTime"
            placeholder="Morning, afternoon, flexible…"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Preferred date <span className="font-normal text-charcoal/60">(optional)</span>
          <input
            name="preferredDate"
            type="date"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
      </div>
      <label className="block text-sm font-medium text-navy">
        Photos <span className="font-normal text-charcoal/60">(optional, up to 5)</span>
        <input
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-sm text-charcoal file:mr-3 file:rounded-lg file:border-0 file:bg-sky/60 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-navy"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-navy">Preferred contact method</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-charcoal">
          <label className="inline-flex min-h-[44px] items-center gap-2">
            <input type="radio" name="contact" value="Call" defaultChecked />
            Call
          </label>
          <label className="inline-flex min-h-[44px] items-center gap-2">
            <input type="radio" name="contact" value="Text" />
            Text
          </label>
          <label className="inline-flex min-h-[44px] items-center gap-2">
            <input type="radio" name="contact" value="Email" />
            Email
          </label>
        </div>
      </fieldset>
      {errorMessage ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <p>{errorMessage}</p>
          <p className="mt-2 text-red-700">
            Need help now? Call{" "}
            <a href={PHONE_TEL} className="font-semibold underline">
              {PHONE_DISPLAY}
            </a>
            .
          </p>
        </div>
      ) : null}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary-lg w-full disabled:opacity-70"
        aria-busy={status === "submitting"}
      >
        {status === "submitting" ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-cream" />
            Submitting…
          </span>
        ) : (
          CTA.primaryEstimate
        )}
      </button>
      <p className="text-center text-xs text-charcoal/70">
        We do not sell your information. Details you enter here stay with {SITE_NAME} for scheduling
        and estimating only.
      </p>
      <div className="rounded-2xl bg-sky/80 p-4 text-center text-sm text-navy">
        Prefer voice?{" "}
        <a
          href={PHONE_TEL}
          className="font-semibold text-ocean no-underline underline-offset-2 hover:underline"
        >
          Call {PHONE_DISPLAY}
        </a>
      </div>
    </form>
  );
}
