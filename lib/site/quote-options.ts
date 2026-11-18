import { AREA_NAMES, SERVICES } from "@/lib/site/content";

export const BEST_TIMES = ["Morning (8–11)", "Midday (11–2)", "Afternoon (2–5)", "Evening (5–7)", "Any time"] as const;
export const AREA_OPTIONS = [...AREA_NAMES, "Elsewhere nearby"] as unknown as [string, ...string[]];
export const SERVICE_OPTIONS = [...SERVICES.map((s) => s.name), "Not sure yet"] as unknown as [string, ...string[]];
