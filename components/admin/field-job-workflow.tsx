"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createInvoiceFromJob, addJobPhoto } from "@/lib/admin/actions/jobs";
import { sendJobReviewRequest, sendJobThankYou, markReviewRequestCompleted } from "@/lib/admin/actions/reviews";
import { publishJobAsProject } from "@/lib/admin/actions/field-workflow";
import { uploadAdminFile } from "@/lib/admin/upload-client";
import { googleMapsDirectionsUrl, phoneSms, phoneTel } from "@/lib/platform/constants";
import { AiAssistPanel } from "@/components/platform/ai-assist-panel";
import type { JobDetailPayload } from "@/lib/admin/types-jobs";

const STEPS = [
  "Start Job",
  "Before Photos",
  "Notes",
  "After Photos",
  "Cover Image",
  "Description",
  "Publish",
  "Invoice",
  "Review",
] as const;

export function FieldJobWorkflow({ data }: { data: JobDetailPayload }) {
  const { job, photos } = data;
  const client = job.clients;
  const beforePhotos = photos.filter((p) => p.category === "before");
  const afterPhotos = photos.filter((p) => p.category === "after");

  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(data.job.job_notes ?? "");
  const [description, setDescription] = useState("");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(
    afterPhotos[0]?.file_url ?? beforePhotos[0]?.file_url ?? null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function run(action: () => Promise<void>) {
    setError("");
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  async function upload(category: "before" | "after", file: File) {
    const uploaded = await uploadAdminFile("job-media", file, `jobs/${job.id}/${category}`);
    await addJobPhoto(job.id, category, uploaded.path, uploaded.publicUrl);
    router.refresh();
  }

  return (
    <div className="space-y-4 pb-32">
      <div className="admin-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-ocean">Field mode</p>
        <h1 className="mt-1 text-xl font-bold text-navy">{client?.name ?? "Job"}</h1>
        <p className="text-sm text-charcoal/70">{job.service_type}</p>
        <p className="mt-1 text-xs text-charcoal/60">{job.address}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {client?.phone ? (
            <>
              <a href={phoneTel(client.phone)} className="admin-btn min-h-[48px] px-4 text-sm no-underline">
                Call
              </a>
              <a href={phoneSms(client.phone)} className="admin-btn-secondary min-h-[48px] px-4 text-sm no-underline">
                Text
              </a>
            </>
          ) : null}
          <a
            href={googleMapsDirectionsUrl(job.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-btn-secondary min-h-[48px] px-4 text-sm no-underline"
          >
            Navigate
          </a>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-semibold ${
              step === index ? "bg-navy text-cream" : "bg-white text-navy border border-navy/10"
            }`}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      {error ? <div className="admin-card text-sm text-red-700">{error}</div> : null}
      {message ? <div className="admin-card text-sm text-leaf">{message}</div> : null}

      {step === 0 ? (
        <section className="admin-card space-y-3">
          <p className="text-sm text-charcoal/80">Confirm you are on site and ready to begin.</p>
          <button
            type="button"
            disabled={pending}
            className="admin-btn min-h-[52px] w-full"
            onClick={() =>
              run(async () => {
                const { updateJobStatus } = await import("@/lib/admin/actions/scheduling");
                await updateJobStatus(job.id, "In Progress");
                setMessage("Job marked in progress.");
                setStep(1);
              })
            }
          >
            Start job
          </button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="admin-card space-y-3">
          <p className="text-sm font-semibold text-navy">Before photos ({beforePhotos.length})</p>
          <label className="admin-btn-secondary flex min-h-[52px] cursor-pointer items-center justify-center">
            Upload before photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                run(async () => {
                  await upload("before", file);
                  setMessage("Before photo uploaded.");
                });
              }}
            />
          </label>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="admin-card space-y-3">
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="admin-input mt-0"
            placeholder="Scope notes, access details, customer requests…"
          />
          <button
            type="button"
            className="admin-btn min-h-[48px] w-full"
            onClick={() => setStep(3)}
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="admin-card space-y-3">
          <p className="text-sm font-semibold text-navy">After photos ({afterPhotos.length})</p>
          <label className="admin-btn-secondary flex min-h-[52px] cursor-pointer items-center justify-center">
            Upload after photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                run(async () => {
                  await upload("after", file);
                  setMessage("After photo uploaded.");
                });
              }}
            />
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="admin-card space-y-3">
          <p className="text-sm font-semibold text-navy">Choose cover image</p>
          <p className="text-sm text-charcoal/80">Pick the best after photo for the portfolio cover.</p>
          {afterPhotos.length ? (
            <ul className="grid grid-cols-2 gap-3">
              {afterPhotos.map((photo) => (
                <li key={photo.id}>
                  <button
                    type="button"
                    onClick={() => setCoverPhotoUrl(photo.file_url)}
                    className={`block w-full overflow-hidden rounded-xl border-2 ${
                      coverPhotoUrl === photo.file_url ? "border-ocean ring-2 ring-ocean/20" : "border-navy/10"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.file_url} alt="After photo option" className="aspect-square w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal/60">Upload at least one after photo first.</p>
          )}
          <button
            type="button"
            disabled={!coverPhotoUrl}
            className="admin-btn min-h-[48px] w-full"
            onClick={() => setStep(5)}
          >
            Continue
          </button>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="admin-card space-y-3">
          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="admin-input mt-0"
            placeholder="Project case study description"
          />
          <AiAssistPanel
            task="project_description"
            label="Generate description"
            context={`${job.service_type} at ${job.address}. Notes: ${notes}`}
            onApply={setDescription}
          />
        </section>
      ) : null}

      {step === 6 ? (
        <section className="admin-card space-y-3">
          <button
            type="button"
            disabled={pending || !description.trim()}
            className="admin-btn min-h-[52px] w-full"
            onClick={() =>
              run(async () => {
                await publishJobAsProject({
                  jobId: job.id,
                  title: `${job.service_type} — ${job.address.split(",")[0]}`,
                  description,
                  notes,
                  coverPhotoUrl,
                });
                setMessage("Draft project created. Publish it from Website CMS when ready.");
                setStep(7);
              })
            }
          >
            Publish portfolio entry
          </button>
        </section>
      ) : null}

      {step === 7 ? (
        <section className="admin-card space-y-3">
          <button
            type="button"
            disabled={pending}
            className="admin-btn min-h-[52px] w-full"
            onClick={() =>
              run(async () => {
                const result = await createInvoiceFromJob(job.id);
                setMessage(result.existing ? "Invoice already linked." : "Invoice draft created.");
                setStep(8);
              })
            }
          >
            Send invoice
          </button>
          {job.invoice_id ? (
            <Link href={`/admin/invoices/${job.invoice_id}`} className="block text-sm font-semibold text-ocean">
              Open invoice →
            </Link>
          ) : null}
        </section>
      ) : null}

      {step === 8 ? (
        <section className="admin-card space-y-3">
          <button
            type="button"
            disabled={pending}
            className="admin-btn min-h-[52px] w-full"
            onClick={() =>
              run(async () => {
                const result = await sendJobReviewRequest(job.id);
                if (result.smsHref) window.open(result.smsHref, "_blank");
                setMessage("Review request ready.");
              })
            }
          >
            Request Google review
          </button>
          <button
            type="button"
            disabled={pending}
            className="admin-btn-secondary min-h-[48px] w-full"
            onClick={() =>
              run(async () => {
                const result = await sendJobThankYou(job.id);
                if (result.smsHref) window.open(result.smsHref, "_blank");
                setMessage("Thank-you text ready.");
              })
            }
          >
            Send thank-you
          </button>
          <button
            type="button"
            disabled={pending}
            className="admin-btn-secondary min-h-[48px] w-full"
            onClick={() =>
              run(async () => {
                await markReviewRequestCompleted(job.id);
                const { updateJobStatus } = await import("@/lib/admin/actions/scheduling");
                await updateJobStatus(job.id, "Completed");
                setMessage("Job completed.");
              })
            }
          >
            Mark completed
          </button>
        </section>
      ) : null}

      <div className="fixed bottom-20 left-0 right-0 z-30 flex gap-2 border-t border-navy/10 bg-cream/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="admin-btn-secondary min-h-[48px] flex-1"
        >
          Back
        </button>
        <button
          type="button"
          disabled={step >= STEPS.length - 1}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          className="admin-btn min-h-[48px] flex-1"
        >
          Next
        </button>
      </div>
    </div>
  );
}
