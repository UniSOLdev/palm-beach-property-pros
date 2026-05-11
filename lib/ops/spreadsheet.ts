import type { SpreadsheetMapping } from "@/lib/ops/types";

export const pbppSpreadsheetMappingDraft: SpreadsheetMapping = {
  sourceName: "PBPP financial operations spreadsheet",
  columns: [
    { sourceColumn: "Date", role: "date", required: true },
    { sourceColumn: "Client", role: "client", required: true },
    { sourceColumn: "Service", role: "service", required: true },
    { sourceColumn: "Revenue", role: "revenue", required: false },
    { sourceColumn: "Expense", role: "expense", required: false },
    { sourceColumn: "Labor Hours", role: "laborHours", required: false },
    { sourceColumn: "Category", role: "category", required: false },
    { sourceColumn: "Status", role: "status", required: false },
    { sourceColumn: "Notes", role: "notes", required: false },
  ],
};

export function describeSpreadsheetIngestionPlan(mapping: SpreadsheetMapping) {
  return [
    `Map ${mapping.sourceName} columns into normalized jobs, contacts, revenue, expenses, and labor records.`,
    "Convert spreadsheet categories into durable service lines and expense categories.",
    "Extract recurring revenue, labor utilization, gross margin, quote pipeline, and customer value KPIs.",
    "Preserve source rows for auditability while dashboards read from normalized operational records.",
    "Expose structured records to future AI reporting, forecasting, and anomaly detection layers.",
  ];
}
