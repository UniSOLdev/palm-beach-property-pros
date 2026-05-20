"use client";

import { TaskQuickAdd } from "@/components/admin/task-quick-add";
import { TaskWorkflowBar } from "@/components/admin/task-workflow-bar";
import type { CrewOption } from "@/lib/admin/types";

export function InvoiceTaskActions({
  invoiceId,
  clientId,
  jobId,
  paymentStatus,
  crew,
}: {
  invoiceId: string;
  clientId: string | null;
  jobId: string | null;
  paymentStatus: string;
  crew: CrewOption[];
}) {
  const defaults = {
    invoice_id: invoiceId,
    client_id: clientId ?? undefined,
    job_id: jobId ?? undefined,
    category: "Invoice Follow-Up" as const,
  };

  const unpaid = paymentStatus !== "Paid";

  return (
    <section className="admin-card space-y-3 print:hidden">
      <h2 className="text-lg font-bold text-navy">Invoice tasks</h2>
      <TaskQuickAdd
        crew={crew}
        variant="primary"
        label="+ Add follow-up task"
        className="w-full"
        defaults={{
          ...defaults,
          title: unpaid ? "Follow up on unpaid invoice" : undefined,
        }}
      />
      {unpaid ? <TaskWorkflowBar context="invoice" defaults={defaults} /> : null}
    </section>
  );
}
