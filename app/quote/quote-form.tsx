"use client";

import { FormEvent, useState } from "react";
import { CTA_LABELS, PBPP_ROUTES } from "@/lib/cta-routes";
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
  "Restaurant & Hospitality Cleaning",
  "Move-In / Move-Out & Relocation Support",
  "Multiple / Not sure",
] as const;

export function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    // Form fields are collected for future API wiring; for now route stays on PBPP.
    window.location.href = PBPP_ROUTES.quote;
    setTimeout(() => setStatus("idle"), 1200);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-3xl border border-navy/10 bg-white p-6 shadow-card sm:p-8"
    >
      <p className="text-sm text-charcoal/85">
        Use the fields below to organize your request. After you submit, we follow up with written
        pricing and scheduling options—everything stays on the PBPP platform.
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          City
          <input
            required
            name="city"
            className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm font-medium text-navy">
          Property type
          <select
            required
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
        Notes
        <textarea
          name="notes"
          rows={4}
          className="mt-1 w-full rounded-xl border border-navy/15 bg-cream px-3 py-2.5 text-charcoal outline-none ring-ocean/30 focus:ring-2"
          placeholder="Square footage, number of windows, timing constraints, access instructions…"
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
      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary-lg w-full disabled:opacity-70"
      >
        {status === "submitting"
          ? "Submitting request…"
          : CTA_LABELS.continueToQuote}
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
          Call or text {PHONE_DISPLAY}
        </a>
      </div>
    </form>
  );
}
