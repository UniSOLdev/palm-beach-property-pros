"use client";

/**
 * Private quote request. Uses the existing submitQuoteRequest pipeline
 * (Supabase quote_requests → Admin → Leads, photo uploads, UTM source) and
 * now also emails the owner (lib/site/notify-quote.ts).
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { submitQuoteRequest } from "@/lib/site/actions/submit-quote-request";
import { QUOTE_ERRORS } from "@/lib/site/quote-submit-types";
import { QUOTE_SERVICE_OPTIONS } from "@/lib/site/catalog";
import { PHONE_DISPLAY, PHONE_TEL, SERVICE_CITIES } from "@/lib/site";

const CITIES = [...SERVICE_CITIES.filter((c) => !c.startsWith("and ")), "Palm Beach", "Tequesta", "Other Palm Beach County"];
const PROPERTY_TYPES = ["Single-family residence", "Estate", "Condominium / townhome", "Rental / Airbnb", "Commercial", "HOA / community"];
const TIMES = ["Morning (8–11)", "Midday (11–2)", "Afternoon (2–5)", "Evening (5–7)", "Any time"];

type Status = "idle" | "submitting" | "success" | "error";

export function QuoteForm({ defaultService, idPrefix = "q" }: { defaultService?: string; idPrefix?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);
  const [referrer, setReferrer] = useState("");
  const [source, setSource] = useState("website");
  const [service, setService] = useState(defaultService ?? "");
  const statusRef = useRef<HTMLDivElement>(null);
  const id = (n: string) => `${idPrefix}-${n}`;

  useEffect(() => {
    setReferrer(document.referrer || "");
    const params = new URLSearchParams(window.location.search);
    const utm = params.get("utm_source")?.trim();
    if (utm) {
      setSource(["website", utm, params.get("utm_medium")?.trim(), params.get("utm_campaign")?.trim()].filter(Boolean).join(":"));
    }
    const fromUrl = params.get("service");
    if (!defaultService && fromUrl && QUOTE_SERVICE_OPTIONS.includes(fromUrl)) setService(fromUrl);
  }, [defaultService]);

  useEffect(() => {
    if (status === "success" || status === "error") {
      statusRef.current?.focus();
      statusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [status]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    // Fold the "in residence" answer into the message the leads board already shows.
    const residence = String(fd.get("residence") ?? "").trim();
    if (residence) {
      const msg = String(fd.get("message") ?? "").trim();
      fd.set("message", [msg, `In residence: ${residence}`].filter(Boolean).join("\n"));
    }
    fd.delete("residence");

    setStatus("submitting");
    setError(null);
    setPhotoNotice(null);
    try {
      const result = await submitQuoteRequest(fd);
      if (result.ok) {
        if (result.photoWarnings?.length) setPhotoNotice(QUOTE_ERRORS.photosSaved);
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
        setError(result.error);
      }
    } catch {
      setStatus("error");
      setError(QUOTE_ERRORS.unexpected);
    }
  }

  if (status === "success") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-[28px] bg-white p-8 text-center shadow-luxury outline-none sm:p-12">
        <p className="eyebrow">Request received</p>
        <p className="font-display mt-3 text-4xl text-navy sm:text-5xl">Thank you.</p>
        <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-charcoal/85">
          We&apos;ll review your details and reach out personally using your preferred method, typically within one business day.
        </p>
        {photoNotice ? <p className="mx-auto mt-4 max-w-md rounded-xl bg-sky/60 px-4 py-3 text-base text-navy">{photoNotice}</p> : null}
        <p className="mt-6 text-lg">
          Prefer to talk now?{" "}
          <a href={PHONE_TEL} className="font-semibold text-navy underline underline-offset-4">
            {PHONE_DISPLAY}
          </a>
        </p>
        <button type="button" onClick={() => setStatus("idle")} className="mt-6 text-base font-medium text-charcoal/70 underline underline-offset-4">
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="rounded-[28px] bg-white p-6 shadow-luxury sm:p-10">
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="referrer" value={referrer} />

      <div ref={statusRef} tabIndex={-1} aria-live="polite" className="outline-none">
        {status === "error" && error ? (
          <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-base font-medium text-red-900">
            {error}{" "}
            <a href={PHONE_TEL} className="font-semibold underline">
              {PHONE_DISPLAY}
            </a>
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="form-step">About you</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor={id("name")} className="sm:col-span-2">
            <input id={id("name")} name="name" required autoComplete="name" className="field-input" />
          </Field>
          <Field label="Phone" htmlFor={id("phone")}>
            <input id={id("phone")} name="phone" type="tel" inputMode="tel" required autoComplete="tel" className="field-input" />
          </Field>
          <Field label="Email" optional htmlFor={id("email")}>
            <input id={id("email")} name="email" type="email" autoComplete="email" className="field-input" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="form-step">Your property</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Property address" hint="Kept strictly private. Used only to scope your quote." htmlFor={id("address")} className="sm:col-span-2">
            <input id={id("address")} name="address" required autoComplete="street-address" className="field-input" />
          </Field>
          <Field label="City / area" htmlFor={id("city")}>
            <select id={id("city")} name="city" defaultValue="" className="field-input">
              <option value="">Select</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Property type" optional htmlFor={id("propertyType")}>
            <select id={id("propertyType")} name="propertyType" defaultValue="" className="field-input">
              <option value="">Select</option>
              {PROPERTY_TYPES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="When are you usually in residence?" optional htmlFor={id("residence")} className="sm:col-span-2">
            <input id={id("residence")} name="residence" placeholder="e.g. November through April, or year-round" className="field-input" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="form-step">How we can help</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Service" htmlFor={id("service")} className="sm:col-span-2">
            <select id={id("service")} name="service" required value={service} onChange={(e) => setService(e.target.value)} className="field-input">
              <option value="" disabled>
                Select a service
              </option>
              {QUOTE_SERVICE_OPTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Details" optional htmlFor={id("message")} className="sm:col-span-2">
            <textarea id={id("message")} name="message" rows={4} placeholder="Scope, timing, access notes, anything we should know." className="field-input" />
          </Field>
          <Field label="Preferred date" optional htmlFor={id("preferredDate")}>
            <input id={id("preferredDate")} name="preferredDate" type="date" className="field-input" />
          </Field>
          <Field label="Best time to reach you" optional htmlFor={id("preferredTime")}>
            <select id={id("preferredTime")} name="preferredTime" defaultValue="" className="field-input">
              <option value="">Select</option>
              {TIMES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Photos" optional hint="Helpful for cleaning, exterior, and detailing quotes. Never published." htmlFor={id("photos")} className="sm:col-span-2">
            <input
              id={id("photos")}
              name="photos"
              type="file"
              accept="image/*"
              multiple
              className="block w-full text-base text-charcoal/80 file:mr-4 file:min-h-[48px] file:rounded-full file:border-0 file:bg-sand file:px-5 file:text-base file:font-semibold file:text-navy"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-10">
        <legend className="form-step">Preferred contact</legend>
        <div className="mt-5 flex flex-wrap gap-3">
          {["Call", "Text", "Email"].map((c, i) => (
            <label key={c} className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-full border border-navy/20 px-6 text-lg has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
              <input type="radio" name="contact" value={c} defaultChecked={i === 0} className="sr-only" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={status === "submitting"} className="btn-navy mt-10 w-full disabled:opacity-70">
        {status === "submitting" ? "Sending…" : "Request a private quote"}
      </button>
      <p className="mt-4 text-center text-base text-charcoal/75">
        No obligation. Your details are never shared or published.
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label} {optional ? <span className="font-normal text-charcoal/70">(optional)</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-2 text-sm text-charcoal/70">{hint}</p> : null}
    </div>
  );
}
