"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AREA_OPTIONS, BEST_TIMES, SERVICE_OPTIONS } from "@/lib/site/quote-options";
import { PHONE_DISPLAY, PHONE_TEL } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "error";

export function QuoteForm({ defaultService, idPrefix = "q" }: { defaultService?: string; idPrefix?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const startedAt = useRef<number>(0);
  const statusRef = useRef<HTMLDivElement>(null);
  const [preselected, setPreselected] = useState<string | undefined>(defaultService);

  useEffect(() => {
    startedAt.current = Date.now();
    // Preselect a service from ?service=… (keeps the /quote page static for SEO/speed).
    if (!defaultService) {
      const fromUrl = new URLSearchParams(window.location.search).get("service");
      if (fromUrl && (SERVICE_OPTIONS as string[]).includes(fromUrl)) setPreselected(fromUrl);
    }
  }, [defaultService]);

  const id = (name: string) => `${idPrefix}-${name}`;
  const errFor = (name: string) =>
    fieldErrors[name] ? (
      <p id={id(`${name}-error`)} className="mt-2 text-base font-medium text-red-800">
        {fieldErrors[name]}
      </p>
    ) : null;
  const describedBy = (name: string) => (fieldErrors[name] ? id(`${name}-error`) : undefined);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => params.get(k)).filter(Boolean);
    const payload = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      area: String(fd.get("area") ?? ""),
      services: fd.getAll("services").map(String),
      residence: String(fd.get("residence") ?? ""),
      bestTime: String(fd.get("bestTime") ?? ""),
      notes: String(fd.get("notes") ?? ""),
      company: String(fd.get("company") ?? ""),
      startedAt: startedAt.current,
      source: utm.length ? `website (${utm.join(" / ")})` : "website",
    };

    setStatus("sending");
    setError("");
    setFieldErrors({});
    try {
      const res = await fetch("/api/quote/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (res.ok && data.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong. Please call us instead.");
        setFieldErrors(data.fieldErrors ?? {});
      }
    } catch {
      setStatus("error");
      setError("We couldn't reach our server. Please call us instead.");
    }
  }

  useEffect(() => {
    if (status === "sent" || status === "error") {
      statusRef.current?.focus();
      statusRef.current?.scrollIntoView({ block: "center" });
    }
  }, [status]);

  if (status === "sent") {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-3xl border border-navy/10 bg-white p-8 text-center shadow-card outline-none"
      >
        <p className="font-display text-4xl text-navy">Thank you.</p>
        <p className="mt-4 text-lg leading-relaxed text-charcoal/90">
          Your request has been received. Clayton will call you personally at the time you
          preferred — usually within one business day.
        </p>
        <p className="mt-4 text-lg">
          Prefer to talk now?{" "}
          <a href={PHONE_TEL} className="font-semibold text-navy underline">
            {PHONE_DISPLAY}
          </a>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-6 rounded-3xl border border-navy/10 bg-white p-6 shadow-card sm:p-8"
      aria-describedby={id("privacy")}
    >
      <div ref={statusRef} tabIndex={-1} className="outline-none" aria-live="polite">
        {status === "error" && error ? (
          <p className="rounded-xl bg-red-50 p-4 text-base font-medium text-red-900" role="alert">
            {error}{" "}
            <a href={PHONE_TEL} className="font-semibold underline">
              {PHONE_DISPLAY}
            </a>
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={id("name")} className="field-label">
            Your name
          </label>
          <input id={id("name")} name="name" autoComplete="name" required className="field-input" aria-invalid={!!fieldErrors.name} aria-describedby={describedBy("name")} />
          {errFor("name")}
        </div>
        <div>
          <label htmlFor={id("phone")} className="field-label">
            Phone
          </label>
          <input id={id("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="field-input" aria-invalid={!!fieldErrors.phone} aria-describedby={describedBy("phone")} />
          {errFor("phone")}
        </div>
        <div>
          <label htmlFor={id("email")} className="field-label">
            Email <span className="font-normal text-charcoal/70">(optional)</span>
          </label>
          <input id={id("email")} name="email" type="email" autoComplete="email" className="field-input" aria-invalid={!!fieldErrors.email} aria-describedby={describedBy("email")} />
          {errFor("email")}
        </div>
        <div>
          <label htmlFor={id("area")} className="field-label">
            Where is the property?
          </label>
          <select id={id("area")} name="area" required defaultValue="" className="field-input" aria-invalid={!!fieldErrors.area} aria-describedby={describedBy("area")}>
            <option value="" disabled>
              Choose an area
            </option>
            {AREA_OPTIONS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          {errFor("area")}
        </div>
        <div>
          <label htmlFor={id("bestTime")} className="field-label">
            Best time to call
          </label>
          <select id={id("bestTime")} name="bestTime" required defaultValue="" className="field-input" aria-invalid={!!fieldErrors.bestTime} aria-describedby={describedBy("bestTime")}>
            <option value="" disabled>
              Choose a time
            </option>
            {BEST_TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          {errFor("bestTime")}
        </div>
      </div>

      <fieldset key={preselected ?? "none"} aria-describedby={describedBy("services")}>
        <legend className="field-label">Services you&apos;re interested in</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_OPTIONS.map((s) => (
            <label
              key={s}
              className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-navy/20 px-4 py-3 text-lg has-[:checked]:border-navy has-[:checked]:bg-sky/60"
            >
              <input
                type="checkbox"
                name="services"
                value={s}
                defaultChecked={preselected === s}
                className="h-6 w-6 shrink-0 accent-navy"
              />
              {s}
            </label>
          ))}
        </div>
        {errFor("services")}
      </fieldset>

      <div>
        <label htmlFor={id("residence")} className="field-label">
          When are you usually in residence? <span className="font-normal text-charcoal/70">(optional)</span>
        </label>
        <input id={id("residence")} name="residence" placeholder="e.g., November through April" className="field-input" />
      </div>

      <div>
        <label htmlFor={id("notes")} className="field-label">
          Anything else we should know? <span className="font-normal text-charcoal/70">(optional)</span>
        </label>
        <textarea id={id("notes")} name="notes" rows={3} className="field-input" />
      </div>

      {/* Honeypot — hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("company")}>Company</label>
        <input id={id("company")} name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={status === "sending"} className="btn-navy w-full disabled:opacity-70">
        {status === "sending" ? "Sending…" : "Request a private quote"}
      </button>
      <p id={id("privacy")} className="text-center text-base text-charcoal/80">
        Your details are kept private and used only to prepare your quote. Prefer the phone?{" "}
        <a href={PHONE_TEL} className="font-semibold text-navy underline">
          {PHONE_DISPLAY}
        </a>
      </p>
    </form>
  );
}
