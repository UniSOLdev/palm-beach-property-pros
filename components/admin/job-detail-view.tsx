"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { PrintButton } from "@/components/admin/print-button";
import {
  addJobExpense,
  addJobPhoto,
  createInvoiceFromJob,
  removeJobPhoto,
} from "@/lib/admin/actions/jobs";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/admin/constants";
import { formatCurrency, formatDate, formatPercent } from "@/lib/admin/format";
import { calculateJobProfitDetail } from "@/lib/admin/job-profit";
import { uploadAdminFile } from "@/lib/admin/upload";
import { TaskJobPanel } from "@/components/admin/task-job-panel";
import type { CrewOption, TaskRow } from "@/lib/admin/types";
import type { JobDetailPayload, JobPhotoCategory } from "@/lib/admin/types-jobs";

const PHOTO_CATEGORIES: { key: JobPhotoCategory; label: string }[] = [
  { key: "before", label: "Before" },
  { key: "after", label: "After" },
  { key: "receipt", label: "Receipt" },
  { key: "general", label: "General" },
];

export function JobDetailView({
  data,
  jobTasks,
  crew,
}: {
  data: JobDetailPayload;
  jobTasks: TaskRow[];
  crew: CrewOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [photoCategory, setPhotoCategory] = useState<JobPhotoCategory>("before");
  const [error, setError] = useState("");
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const { job, photos, expenses, crewPayouts, crewNames } = data;
  const client = job.clients;
  const profit = useMemo(
    () =>
      calculateJobProfitDetail({
        revenue: Number(job.revenue),
        expenses,
        crewPayouts,
        estimated_labor_cost: job.estimated_labor_cost,
        estimated_materials_cost: job.estimated_materials_cost,
        fuel_cost: job.fuel_cost,
        dump_fee_cost: job.dump_fee_cost,
        truck_rental_cost: job.truck_rental_cost,
        equipment_cost: job.equipment_cost,
      }),
    [job, expenses, crewPayouts],
  );

  const crewLabels = (job.assigned_crew_ids ?? [])
    .map((id) => crewNames[id])
    .filter(Boolean)
    .join(", ");

  function handlePhotoUpload(file: File) {
    setError("");
    startTransition(async () => {
      try {
        const uploaded = await uploadAdminFile("job-media", file, `jobs/${job.id}/${photoCategory}`);
        await addJobPhoto(job.id, photoCategory, uploaded.path, uploaded.publicUrl);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      }
    });
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/admin/jobs" className="text-sm font-semibold text-ocean no-underline">
            ← Jobs
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-navy">{job.service_type}</h1>
          <p className="text-sm text-charcoal/70">{client?.name ?? "Client"}</p>
        </div>
        <span className="admin-chip bg-sky/60 text-navy">{job.status}</span>
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Revenue" value={formatCurrency(profit.revenue)} />
        <Stat label="Total cost" value={formatCurrency(profit.totalCost)} />
        <Stat label="Profit" value={formatCurrency(profit.profit)} highlight={profit.profit >= 0} />
        <Stat label="Margin" value={formatPercent(profit.margin)} />
      </div>

      <section className="admin-card space-y-3">
        <h2 className="text-lg font-bold text-navy">Job details</h2>
        <DetailRow label="Address" value={job.address} />
        <DetailRow
          label="Scheduled"
          value={`${formatDate(job.job_date)}${job.start_time ? ` · ${job.start_time}` : ""}${job.end_time ? ` – ${job.end_time}` : ""}`}
        />
        {crewLabels ? <DetailRow label="Crew" value={crewLabels} /> : null}
        {client?.phone ? <DetailRow label="Phone" value={client.phone} /> : null}
        <DetailRow label="Created" value={formatDate(job.created_at)} />
      </section>

      {job.job_notes ? (
        <section className="admin-card">
          <h2 className="text-lg font-bold text-navy">Scope of work</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/85">{job.job_notes}</p>
        </section>
      ) : null}

      {job.internal_notes ? (
        <section className="admin-card border-ocean/20 bg-sky/20">
          <h2 className="text-lg font-bold text-navy">Internal notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/85">{job.internal_notes}</p>
        </section>
      ) : null}

      <TaskJobPanel jobId={job.id} clientId={job.client_id} tasks={jobTasks} crew={crew} />

      <section id="photos" className="admin-card space-y-4 scroll-mt-24">
        <h2 className="text-lg font-bold text-navy">Photos</h2>
        <div className="flex flex-wrap gap-2">
          {PHOTO_CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setPhotoCategory(c.key)}
              className={`min-h-[44px] rounded-full px-4 text-sm font-semibold ${
                photoCategory === c.key ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-navy/15"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <label className="block text-sm font-medium text-navy">
          Upload {photoCategory} photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="admin-input"
            disabled={pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePhotoUpload(f);
              e.target.value = "";
            }}
          />
        </label>
        <PhotoGrid
          photos={photos}
          pending={pending}
          onRemove={(photo) =>
            startTransition(async () => {
              try {
                await removeJobPhoto(photo.id, job.id, photo.storage_path || null);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not remove photo");
              }
            })
          }
        />
      </section>

      <section className="admin-card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-navy">Job expenses</h2>
          <button
            type="button"
            className="admin-btn-secondary min-h-[44px] px-3 text-xs"
            onClick={() => setShowExpenseForm((v) => !v)}
          >
            {showExpenseForm ? "Cancel" : "Add"}
          </button>
        </div>
        <p className="text-sm text-charcoal/70">
          Subtotal: <span className="font-bold text-navy">{formatCurrency(profit.linkedExpenses)}</span>
        </p>
        {showExpenseForm ? (
          <form
            className="space-y-3 border-t border-navy/10 pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                let receipt_url: string | null = null;
                const file = fd.get("receipt") as File | null;
                if (file && file.size > 0) {
                  const up = await uploadAdminFile("receipts", file, `jobs/${job.id}`);
                  receipt_url = up.publicUrl;
                }
                await addJobExpense(job.id, {
                  expense_date: String(fd.get("expense_date")),
                  category: String(fd.get("category")),
                  vendor: String(fd.get("vendor")),
                  description: String(fd.get("description")),
                  amount: Number(fd.get("amount")),
                  payment_method: String(fd.get("payment_method")),
                  receipt_url,
                });
                setShowExpenseForm(false);
                router.refresh();
              });
            }}
          >
            <input
              type="date"
              name="expense_date"
              required
              className="admin-input"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
            <select name="category" className="admin-input" defaultValue="Supplies">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input name="vendor" required className="admin-input" placeholder="Vendor" />
            <input name="description" required className="admin-input" placeholder="Description" />
            <input name="amount" type="number" step="0.01" required className="admin-input" placeholder="Amount" />
            <select name="payment_method" className="admin-input" defaultValue="Card">
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input type="file" name="receipt" accept="image/*" capture="environment" className="admin-input" />
            <button type="submit" disabled={pending} className="admin-btn w-full">
              Save expense
            </button>
          </form>
        ) : null}
        <ul className="space-y-2">
          {expenses.length === 0 ? (
            <li className="text-sm text-charcoal/60">No job-linked expenses yet.</li>
          ) : (
            expenses.map((e) => (
              <li key={e.id} className="rounded-xl border border-navy/10 bg-cream/40 px-3 py-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-semibold text-navy">{e.description}</span>
                  <span className="font-bold">{formatCurrency(Number(e.amount))}</span>
                </div>
                <p className="text-xs text-charcoal/60">
                  {e.category} · {e.vendor} · {formatDate(e.expense_date)}
                </p>
                {e.receipt_url ? (
                  <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-ocean">
                    View receipt
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>

      {crewPayouts.length > 0 ? (
        <section className="admin-card space-y-2">
          <h2 className="text-lg font-bold text-navy">Crew payouts</h2>
          <p className="text-sm text-charcoal/70">
            Total: <span className="font-bold">{formatCurrency(profit.crewPayouts)}</span>
          </p>
          <ul className="space-y-2 text-sm">
            {crewPayouts.map((p) => (
              <li key={p.id} className="flex justify-between rounded-xl bg-cream/40 px-3 py-2">
                <span>{p.pay_type}</span>
                <span className="font-semibold">{formatCurrency(Number(p.calculated_total))}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="admin-card space-y-2 text-sm">
        <h2 className="text-lg font-bold text-navy">Cost breakdown</h2>
        <Row label="Linked expenses" value={formatCurrency(profit.linkedExpenses)} />
        <Row label="Crew payouts" value={formatCurrency(profit.crewPayouts)} />
        <Row label="Labor / materials / fuel / equipment" value={formatCurrency(profit.directCosts)} />
      </section>

      <div id="job-print-area" className="hidden print:block">
        <h1 className="text-xl font-bold">{job.service_type}</h1>
        <p>{client?.name}</p>
        <p>{job.address}</p>
        <p>
          {formatDate(job.job_date)} · {job.status}
        </p>
        <p>Revenue: {formatCurrency(profit.revenue)}</p>
        <p>Profit: {formatCurrency(profit.profit)}</p>
      </div>

      <JobActionBar
        jobId={job.id}
        invoiceId={job.invoice_id}
        pending={pending}
        onInvoice={() =>
          startTransition(async () => {
            try {
              const result = await createInvoiceFromJob(job.id);
              router.push(`/admin/invoices/${result.invoiceId}`);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Invoice failed");
            }
          })
        }
      />
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`admin-card ${highlight === false ? "ring-1 ring-red-200" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">{label}</p>
      <p className="mt-1 text-lg font-bold text-navy">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-navy">{label}: </span>
      <span className="text-charcoal/85">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-charcoal/70">{label}</span>
      <span className="font-semibold text-navy">{value}</span>
    </div>
  );
}

function PhotoGrid({
  photos,
  pending,
  onRemove,
}: {
  photos: JobDetailPayload["photos"];
  pending: boolean;
  onRemove: (photo: JobDetailPayload["photos"][number]) => void;
}) {
  if (photos.length === 0) {
    return <p className="text-sm text-charcoal/60">No photos uploaded yet.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-3">
      {photos.map((photo) => (
        <li key={photo.id} className="overflow-hidden rounded-xl border border-navy/10 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.file_url} alt={photo.category} className="aspect-square w-full object-cover" />
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <span className="text-xs font-semibold capitalize text-navy">{photo.category}</span>
            {!photo.legacy ? (
              <button
                type="button"
                disabled={pending}
                className="min-h-[44px] px-2 text-xs font-semibold text-red-600"
                onClick={() => onRemove(photo)}
              >
                Remove
              </button>
            ) : (
              <span className="text-[10px] text-charcoal/50">Legacy</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function JobActionBar({
  jobId,
  invoiceId,
  pending,
  onInvoice,
}: {
  jobId: string;
  invoiceId: string | null;
  pending: boolean;
  onInvoice: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 border-t border-navy/10 bg-cream/95 px-3 py-2 backdrop-blur-md pb-safe">
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2 sm:grid-cols-3">
        <Link href={`/admin/jobs/${jobId}/edit`} className="admin-btn-secondary min-h-[48px] text-center text-xs no-underline">
          Edit job
        </Link>
        <a href="#photos" className="admin-btn-secondary min-h-[48px] text-center text-xs no-underline">
          Upload photos
        </a>
        {invoiceId ? (
          <Link
            href={`/admin/invoices/${invoiceId}`}
            className="admin-btn min-h-[48px] text-center text-xs no-underline"
          >
            View invoice
          </Link>
        ) : (
          <button type="button" disabled={pending} onClick={onInvoice} className="admin-btn min-h-[48px] text-xs">
            Create invoice
          </button>
        )}
        <button
          type="button"
          className="admin-btn-secondary min-h-[48px] text-xs opacity-60"
          disabled
          title="Quote builder coming soon"
        >
          Quote (soon)
        </button>
        <div className="col-span-2 sm:col-span-1">
          <PrintButton label="Print summary" className="admin-btn-secondary min-h-[48px] w-full text-xs" />
        </div>
      </div>
    </div>
  );
}
