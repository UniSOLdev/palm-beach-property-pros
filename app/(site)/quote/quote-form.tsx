"use client";

import { FormEvent, useEffect, useState } from "react";
import { submitQuoteRequest } from "@/lib/site/actions/submit-quote-request";
import { PHONE_DISPLAY, PHONE_TEL, SITE_NAME } from "@/lib/site";

const services = [
  "Window Cleaning",
  "Residential Cleaning",
  "Commercial Cleaning",
  "Pressure Washing / Exterior",
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
  const [referrer, setReferrer] = useState("");

  useEffect(() => {
    setReferrer(document.referrer || "");
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitQuoteRequest(formData);

    if (result.ok) {
      if (result.photoWarnings?.length) {
        console.warn("[PBPP Quote] submitted with photo warnings:", result.photoWarnings);
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
    >
      <input type="hidden" name="source" value="website" />
      <input type="hidden" name="referrer" value={referrer} />

      <p className="text-sm text-charcoal/85">
        Share your property details below. Our team uses this information to prepare scope-based
        pricing—photos, scheduling, invoices, and approvals all stay on {SITE_NAME}.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Name
          <input
            required
            name="name"
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Phone
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
        Service needed
        <select
          required
          name="service"
          defaultValue={matchedService}
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
        Property address
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
        Details / message
        <textarea
          name="message"
          rows={4}
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          placeholder="Square footage, number of windows, timing constraints, access instructions…"
        />
      </label>
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
          Preferred time <span className="font-normal text-charcoal/60">(optional)</span>
          <input
            name="preferredTime"
            placeholder="Morning, afternoon, after 2pm…"
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
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="contact" value="Call" defaultChecked />
            Call
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="contact" value="Text" />
            Text
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" name="contact" value="Email" />
            Email
          </label>
        </div>
      </fieldset>
      {errorMessage ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{errorMessage}</p>
      ) : null}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary-lg w-full disabled:opacity-70"
      >
        {status === "submitting" ? "Submitting…" : "Submit quote request"}
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
