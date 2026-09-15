import type { AdminEntityType } from "./types";

export const ENTITY_TABLE: Record<AdminEntityType, string> = {
  client: "clients",
  lead: "quote_requests",
  quote: "quotes",
  invoice: "invoices",
  job: "jobs",
  task: "tasks",
  expense: "expenses",
};

export const ENTITY_ADMIN_PATH: Record<AdminEntityType, string> = {
  client: "/admin/clients",
  lead: "/admin/leads",
  quote: "/admin/quotes",
  invoice: "/admin/invoices",
  job: "/admin/jobs",
  task: "/admin/tasks",
  expense: "/admin/expenses",
};

export function entityDetailPath(type: AdminEntityType, id: string): string | null {
  switch (type) {
    case "client":
      return `${ENTITY_ADMIN_PATH.client}?highlight=${id}`;
    case "lead":
      return `/admin/leads/${id}`;
    case "quote":
      return `/admin/quotes/${id}`;
    case "invoice":
      return `/admin/invoices/${id}`;
    case "job":
      return `/admin/jobs/${id}`;
    case "task":
      return `${ENTITY_ADMIN_PATH.task}?highlight=${id}`;
    case "expense":
      return `${ENTITY_ADMIN_PATH.expense}?highlight=${id}`;
    default:
      return null;
  }
}

export function entityEditPath(type: AdminEntityType, id: string): string | null {
  switch (type) {
    case "job":
      return `/admin/jobs/${id}/edit`;
    case "invoice":
      return `/admin/invoices/${id}`;
    case "quote":
      return `/admin/quotes/${id}`;
    case "lead":
      return `/admin/leads/${id}`;
    default:
      return entityDetailPath(type, id);
  }
}
