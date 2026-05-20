"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateJob } from "@/lib/admin/actions/jobs";
import type { JobRow } from "@/lib/admin/types-jobs";

const STATUSES = ["Scheduled", "In Progress", "Completed", "Cancelled", "On Hold"];

export function JobEditForm({ job }: { job: JobRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="admin-card space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await updateJob(job.id, {
            service_type: String(fd.get("service_type")),
            status: String(fd.get("status")),
            job_date: String(fd.get("job_date")),
            start_time: String(fd.get("start_time") || "") || null,
            end_time: String(fd.get("end_time") || "") || null,
            address: String(fd.get("address")),
            job_notes: String(fd.get("job_notes") || "") || null,
            internal_notes: String(fd.get("internal_notes") || "") || null,
            revenue: Number(fd.get("revenue")),
            estimated_labor_cost: Number(fd.get("estimated_labor_cost")),
            estimated_materials_cost: Number(fd.get("estimated_materials_cost")),
            fuel_cost: Number(fd.get("fuel_cost")),
            dump_fee_cost: Number(fd.get("dump_fee_cost")),
            truck_rental_cost: Number(fd.get("truck_rental_cost")),
            equipment_cost: Number(fd.get("equipment_cost")),
          });
          router.push(`/admin/jobs/${job.id}`);
          router.refresh();
        });
      }}
    >
      <Field label="Service type" name="service_type" defaultValue={job.service_type} required />
      <label className="block text-sm font-medium text-navy">
        Status
        <select name="status" defaultValue={job.status} className="admin-input">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <Field label="Job date" name="job_date" type="date" defaultValue={job.job_date} required />
      <Field label="Start time" name="start_time" defaultValue={job.start_time ?? ""} placeholder="9:00 AM" />
      <Field label="End time" name="end_time" defaultValue={job.end_time ?? ""} placeholder="2:00 PM" />
      <Field label="Address" name="address" defaultValue={job.address} required />
      <label className="block text-sm font-medium text-navy">
        Scope of work
        <textarea name="job_notes" rows={4} className="admin-input" defaultValue={job.job_notes ?? ""} />
      </label>
      <label className="block text-sm font-medium text-navy">
        Internal notes
        <textarea name="internal_notes" rows={3} className="admin-input" defaultValue={job.internal_notes ?? ""} />
      </label>
      <Field label="Revenue ($)" name="revenue" type="number" step="0.01" defaultValue={String(job.revenue)} />
      <p className="text-sm font-semibold text-navy">Job cost fields</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Labor" name="estimated_labor_cost" type="number" step="0.01" defaultValue={String(job.estimated_labor_cost)} />
        <Field label="Materials" name="estimated_materials_cost" type="number" step="0.01" defaultValue={String(job.estimated_materials_cost)} />
        <Field label="Fuel" name="fuel_cost" type="number" step="0.01" defaultValue={String(job.fuel_cost)} />
        <Field label="Dump fees" name="dump_fee_cost" type="number" step="0.01" defaultValue={String(job.dump_fee_cost)} />
        <Field label="Truck rental" name="truck_rental_cost" type="number" step="0.01" defaultValue={String(job.truck_rental_cost)} />
        <Field label="Equipment" name="equipment_cost" type="number" step="0.01" defaultValue={String(job.equipment_cost)} />
      </div>
      <button type="submit" disabled={pending} className="admin-btn w-full">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  step,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
  step?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-navy">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        placeholder={placeholder}
        className="admin-input"
      />
    </label>
  );
}
